/* The iPhone desk check of 22 November 2026 (polish round, item 1). There is no iPhone and no Simulator here, so what breaks in iOS Safari was found by reading, and is kept from coming back by reading too: the page head, the stylesheet and the sources are read as text.
   1. The viewport asks for the whole screen (viewport-fit=cover) and never turns pinch-zoom off.
   2. At phone width every text field is 1rem, so Safari does not zoom the page when one gets the cursor.
   3. A quick second tap on a control does not zoom the page (touch-action: manipulation); pinch-zoom stays.
   4. Every dialog and sheet cut to a vh height has a dvh twin (Safari's 100vh is taller than the screen it shows) and the vh line stays for a browser without dvh.
   5. Safe areas: dialogs, the bottom bar, the page's side padding and the reader's top bar keep clear of the notch and the home bar.
   6. Every backdrop-filter and user-select: none has the -webkit- name Safari still needs.
   7. Nothing the page loads uses a script or style feature that Safari 16.4 lacks, beyond what AA-03 of alpha-fixes-a.test.js already keeps out.
   Run: node tests/ios-desk.test.js */
const fs = require('fs'); const path = require('path');
const lamp = path.join(__dirname, '..');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };
const rawCss = fs.readFileSync(path.join(lamp, 'src/css/app.css'), 'utf8'); const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');
const build = fs.readFileSync(path.join(lamp, 'build.py'), 'utf8');
const jsDir = path.join(lamp, 'src/js'); const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
const inner = (text, openAt) => { const o = text.indexOf('{', openAt); let d = 0; for (let j = o; j < text.length; j++) { if (text[j] === '{') d++; else if (text[j] === '}') { d--; if (d === 0) return text.slice(o + 1, j); } } return ''; };
const flat = []; { const re = /([^{}]+)\{([^{}]*)\}/g; let m; while ((m = re.exec(css))) flat.push({ sel: m[1].trim(), decl: m[2] }); }
const rulesFor = (sel) => flat.filter((r) => r.sel.split(',').map((s) => s.trim()).includes(sel));

/* ═══ 1. the viewport ═══ */
const vp = (build.match(/<meta name="viewport" content="([^"]*)"/) || [])[1] || '';
ok('1: the viewport is the device width and covers the screen (the safe areas below depend on it)', /width=device-width/.test(vp) && /viewport-fit=cover/.test(vp), vp);
{ const bad = []; ['build.py', ...jsFiles.map((f) => 'src/js/' + f)].forEach((f) => { const t = fs.readFileSync(path.join(lamp, f), 'utf8'); if (/user-scalable|maximum-scale|minimum-scale/.test(t)) bad.push(f); });
  ok('1: nothing in the page head or the sources turns pinch-zoom off (user-scalable, maximum-scale, minimum-scale)', bad.length === 0, bad); }

/* ═══ 2. text fields are 1rem at phone width ═══ */
{ const am = /@media \(max-width:760px\),\(pointer:coarse\)\{\s*input:not\(\[type=range\]\)/.exec(css); const at = am ? am.index : -1; const body = at >= 0 ? inner(css, at) : '';
  const m = body.match(/^\s*(input:not[^{]*select,textarea)\{font-size:1rem!important\}\s*$/); const sels = m ? m[1] : '';
  ok('2: a phone-width block sets font-size: 1rem on input, select and textarea, with !important (a dozen rules give a field 13 px, 12 px or the page text\'s 15 px)', !!m, body.slice(0, 200));
  ok('2: every field that takes typing is covered: text, search, number, date, time, email, url, tel and password are not excluded', ['text', 'search', 'number', 'date', 'time', 'email', 'url', 'tel', 'password'].every((t) => !sels.includes('[type=' + t + ']')), sels);
  ok('2: the ones that take none are left alone: range, checkbox, radio, colour, file and buttons', ['range', 'checkbox', 'radio', 'color', 'file', 'button', 'submit', 'reset', 'image'].every((t) => sels.includes(':not([type=' + t + '])')), sels);
  const body15 = (css.match(/(?:^|[}\s])body\{[^}]*font:\s*([\d.]+)rem/) || [])[1];
  ok('2: the page text is under 1rem (so without the rule a field would be under 16 px)', body15 && parseFloat(body15) < 1, body15); }

/* ═══ 3. no double-tap zoom on controls ═══ */
{ const r = flat.filter((x) => /(^|;)\s*touch-action:\s*manipulation\s*;?\s*$/.test(x.decl) && x.sel.split(',').map((s) => s.trim()).includes('button'));
  const list = r.length ? r[0].sel.split(',').map((s) => s.trim()) : [];
  ok('3: links, buttons, summaries, labels, selects, text areas, role=button/tab/menuitem/switch/checkbox/radio and every input but a range get touch-action: manipulation', r.length === 1 && ['a', 'button', 'summary', 'label', 'select', 'textarea', '[role=button]', '[role=tab]', '[role=menuitem]', '[role=switch]', '[role=checkbox]', '[role=radio]', 'input:not([type=range])'].every((s) => list.includes(s)), list);
  ok('3: a slider is not given it (its thumb is dragged sideways)', !list.includes('input') && list.includes('input:not([type=range])'));
  ok('3: no rule sets touch-action: none or pan-only on a control (that would turn pinch-zoom off); the map canvas and the paged reader keep their own', flat.filter((x) => /touch-action:\s*(none|pan-[xy])(\s|;|$)/.test(x.decl)).every((x) => /atl-canvas|canvas|\.pgview/.test(x.sel)), flat.filter((x) => /touch-action:\s*(none|pan-[xy])(\s|;|$)/.test(x.decl)).map((x) => x.sel)); }

/* ═══ 4. dvh twins ═══ */
{ const at = css.indexOf('@supports (height:1dvh){'); const body = at >= 0 ? inner(css, at) : '';
  ok('4: there is a dvh block', at >= 0);
  const compact = body.replace(/\s+/g, ''); const twin = (sel, d) => { const key = sel + '{'; let i = -1; while ((i = compact.indexOf(key, i + 1)) >= 0) { const end = compact.indexOf('}', i); if (compact.slice(i, end).includes(d)) return true; } return false; };
  [['.modal', 'max-height:calc(100dvh'], ['.rdmore', 'max-height:calc(100dvh'], ['.pal-list', 'max-height:min(52dvh'], ['.pal-back', 'padding-top:12dvh'], ['.tcard', 'max-height:min(70dvh'], ['.rtpanel', 'max-height:min(82dvh'], ['.atl-dive', 'max-height:58dvh'], ['.med-sit', 'min-height:calc(100dvh'], ['.rdsheet-in', 'height:88dvh;max-height:88dvh'], ['.atl-dive', 'max-height:54dvh'], ['.atl-dive', 'max-height:42dvh'], ['.tcard', 'max-height:55dvh'], ['.rtpanel', 'max-height:60dvh']]
    .forEach(([sel, d]) => ok('4: ' + sel + ' has its dvh twin (' + d + ')', twin(sel, d)));
  ok('4: the dvh block only changes heights (no colour, no position: a laptop looks the same, since dvh equals vh there)', !/(color|background|position|display|width\s*:|margin|border)/.test(body.replace(/@media[^{]*/g, '').replace(/min-width|max-width|max-height|min-height|padding-top|height/g, '')), body.slice(0, 300));
  ['.modal', '.rdmore', '.tcard', '.rtpanel', '.atl-dive', '.pal-list'].forEach((s) => ok(`4: the vh line of ${s} is still there for a browser without dvh`, rulesFor(s).some((r) => /\d\s*vh/.test(r.decl)), s)); }

/* ═══ 5. safe areas ═══ */
ok('5: a dialog\'s backdrop keeps 1.25rem from every edge and clears the notch, the rounded corners and the home bar (all four insets)', (() => { const r = rulesFor('.modal-back').map((x) => x.decl).filter((d) => /padding:/.test(d)).pop() || ''; return ['top', 'right', 'bottom', 'left'].every((s) => r.includes('env(safe-area-inset-' + s)) && /max\(1\.25rem,/.test(r); })());
ok('5: a dialog is no taller than the screen minus the notch and the home bar', /\.modal\{max-height:calc\(100dvh - 2\.5rem - env\(safe-area-inset-top,0px\) - env\(safe-area-inset-bottom,0px\)\)\}/.test(css));
ok('5: the bottom bar (phone layout) clears the notch in landscape on both sides', /@media \(max-width:860px\)\{\s*\.side\{padding-left:calc\(\.375rem \+ env\(safe-area-inset-left,0px\)\);padding-right:calc\(\.375rem \+ env\(safe-area-inset-right,0px\)\)\}/.test(css));
ok('5: the side menu (laptop layout) clears it on the left, the page on the right', /@media \(min-width:861px\)\{\.side\{padding-left:calc\(\.875rem \+ env\(safe-area-inset-left,0px\)\)\}\}/.test(css) && /\.main\{padding-right:max\(clamp\(16px,3\.6vw,56px\),env\(safe-area-inset-right,0px\)\)\}/.test(css));
ok('5: on a phone the page clears the notch on the left too', /@media \(max-width:860px\)\{[^@]*\.main\{padding-left:max\(clamp\(16px,3\.6vw,56px\),env\(safe-area-inset-left,0px\)\)\}/.test(css));
ok('5: the reader\'s top bar clears the status bar when the page is opened from the Home Screen', /\.rdtop\{padding-top:max\(\.375rem,env\(safe-area-inset-top,0px\)\)\}/.test(css));
ok('5: the bar at the foot (phone), the toast stack, the pocket player and the reader\'s paged view already count the home bar (kept)', ['.side{position:fixed;top:auto;bottom:0', 'bottom:calc(72px + env(safe-area-inset-bottom))', '--pgb:calc(38px + env(safe-area-inset-bottom,0px))', 'bottom:max(8px,env(safe-area-inset-bottom,0px))'].every((s) => rawCss.includes(s)));
ok('5: the page head has no max-scale and the status bar colour is set (theme-color)', /<meta name="theme-color"/.test(build));

/* ═══ 6. the prefixes Safari still needs ═══ */
{ const bad = flat.filter((r) => /(^|;)\s*backdrop-filter:/.test(r.decl) && !/-webkit-backdrop-filter:/.test(r.decl)).map((r) => r.sel);
  ok('6: every backdrop-filter has -webkit-backdrop-filter in the same rule (Safari before 18 ignores the plain name)', bad.length === 0, bad);
  const prefixed = new Set(); flat.filter((r) => /-webkit-user-select:\s*none/.test(r.decl)).forEach((r) => r.sel.split(',').forEach((s) => prefixed.add(s.trim())));
  const noPre = []; flat.filter((r) => /(^|;)\s*user-select:\s*none/.test(r.decl) && !/-webkit-user-select:\s*none/.test(r.decl)).forEach((r) => r.sel.split(',').map((s) => s.trim()).forEach((s) => { if (!prefixed.has(s)) noPre.push(s); }));
  ok('6: every selector with user-select: none also has -webkit-user-select: none (a verse number is not copied with the verse; a chip is not selected by a long press)', noPre.length === 0, noPre);
  ok('6: the verse number .vn is among them', prefixed.has('.vn')); }
ok('6: a colour that cannot be mixed (iOS before 16.2) leaves the reader\'s top bar a plain page colour', /@supports not \(background:color-mix\(in srgb,red 50%,blue\)\)\{\.rdtop\{background:var\(--bg\)\}\}/.test(css));

/* ═══ 7. nothing newer than Safari 16.4 ═══ */
{ const bad = []; const pats = [['requestIdleCallback', 'requestIdleCallback (no Safari has it)'], ['scrollend', 'the scrollend event'], ['Object.groupBy', 'Object.groupBy'], ['Map.groupBy', 'Map.groupBy'], ['Promise.withResolvers', 'Promise.withResolvers'], ['.union(', 'Set.union'], ['.intersection(', 'Set.intersection'], ['.isSubsetOf(', 'Set.isSubsetOf'], ['.isSupersetOf(', 'Set.isSupersetOf'], ['.isDisjointFrom(', 'Set.isDisjointFrom'], ['Intl.DurationFormat', 'Intl.DurationFormat'], ['showPopover', 'the popover API'], ['.checkVisibility(', 'checkVisibility'], ['AbortSignal.any', 'AbortSignal.any'], ['Iterator.from', 'Iterator helpers'], ['.toWellFormed(', 'toWellFormed']];
  jsFiles.forEach((f) => { const t = fs.readFileSync(path.join(jsDir, f), 'utf8'); pats.forEach(([p, why]) => { if (t.includes(p)) bad.push(f + ': ' + why); }); });
  ok('7: no source file uses requestIdleCallback, scrollend, Object.groupBy, Promise.withResolvers, the Set methods, popover, checkVisibility, AbortSignal.any, iterator helpers or toWellFormed (none is in Safari 16.4)', bad.length === 0, bad);
  const badCss = ['@starting-style', 'light-dark(', 'field-sizing', 'anchor-name', 'position-anchor', '@scope', 'view-transition', 'interpolate-size', 'text-box-trim', ':popover-open'].filter((p) => css.includes(p));
  ok('7: the stylesheet has no @starting-style, light-dark(), field-sizing, anchor positioning, @scope, view transitions or popover (none is in Safari 16.4)', badCss.length === 0, badCss);
  ok('7: the reader offers Full screen only where the browser has it (an iPhone has none)', /document\.fullscreenEnabled \? \['fullscreen'/.test(fs.readFileSync(path.join(jsDir, '6k-reader.js'), 'utf8'))); }

console.log(`ios-desk: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
