/* Tap targets on the pages a friend reaches from a link: a tradition's page, a conflict, a Journey view (RC-02 of FINAL_AUDIT.md section 10.6, 23 November 2026).
   The two earlier rounds (tests/tap.test.js, tests/tap-second.test.js) covered the section pages and the High-control groups. A regression crawl at 375 px found, on the pages reached from a link, a back line 15 px high on every
   tradition page, conflict and Journey view, footnote buttons 19 x 19 on the conflicts (113 of 211 controls), and on the tradition pages the "on the map" links and the lines of links in Relationships (782 of 3,160 controls; the
   controls inside a closed <details> are not counted, they cannot be tapped). The rules are the last block of the style sheet, its query written the other way round so that tests/tap-second.test.js still finds its own block;
   the markup carries the classes they need. A mouse on a wide window is not touched. No browser is needed.
   Run: node tests/tap-entities.test.js */
const fs = require('fs'); const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '../src/css/app.css'), 'utf8'); const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
const src = (f) => fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };

const Q = '@media (max-width:760px),(pointer:coarse){';
const at = plain.lastIndexOf(Q);
const block = (() => { let d = 0; for (let j = plain.indexOf('{', at); j < plain.length; j++) { if (plain[j] === '{') d++; else if (plain[j] === '}') { d--; if (d === 0) return plain.slice(at, j + 1); } } return ''; })();
const before = plain.slice(0, at);

ok('the rules are the last block of the style sheet, inside the phone-or-touch query (a mouse on a wide window is not touched), and the block of tests/tap-second.test.js is still the last one written the other way round', at > 0 && block.length > 400 && block.includes('.cnf-cite::after') && plain.slice(at + block.length).trim() === '' && plain.lastIndexOf('@media (pointer:coarse),(max-width:760px){') < at);
ok('a link that has a line to itself (the other tradition of a relationship, a practice link, “N more in the catalogue”, “More in the family tree”, “All shared ideas →”, a related conflict, a source of a conflict) is an inline-block 40 px high, 11 px above and below its line, as in AA-17', /\.rl-link>a,\.hub-more>a,\.more-link,\.cnf-rel li>a,\.cnf-src li>a\{display:inline-block;max-width:100%;padding-block:11px\}/.test(block));
ok('a short name in a relationship line (“Islam”, 31 px wide) is in a box 40 px wide', /\.rl-link>a\{min-width:2\.5rem\}/.test(block));
ok('the back line at the head of a page (the div with the inline margin that holds one link, and the conflicts’ own back line) is an inline-block 40 px high', /\.small\[style="margin-bottom:10px"\]>a:first-child,\.cnf-back>a\{display:inline-block;padding-block:11px\}/.test(block));
ok('a dated record’s “on the map” link has an invisible ::after 11 px above and below it (the room is the row’s own padding and border, with nothing to tap in it), as wide as the link', /\.atl-ptl-row>a\{position:relative\} \.atl-ptl-row>a::after\{content:"";position:absolute;inset:-11px 0\}/.test(block));
{ const m = block.match(/\.cnf-cites\{gap:([\d.]+)rem\} \.cnf-cite\{position:relative\} \.cnf-cite::after\{content:"";position:absolute;inset:-([\d.]+)px\}/); const base = plain.match(/\.cnf-cite\{[^}]*min-width:(\d+)px;height:(\d+)px;[^}]*\}/); const bord = /\.cnf-cite\{[^}]*border:1px solid/.test(plain);
  ok('the footnote buttons of a conflict are 19 px boxes with a 1 px border: the ::after starts inside the border, so its inset of 11.5 px makes a hit area of 40 px, and the buttons are 40 px apart (19 + 21), so no two hit areas meet', !!m && !!base && bord && +base[1] === 19 && +base[2] === 19 && Math.abs((19 - 2) + 2 * +m[2] - 40) < 0.01 && Math.abs(19 + (+m[1]) * 16 - 40) < 0.01, [m && m.slice(1), base && base.slice(1)]); }
ok('none of these classes is used outside the query (nothing changes for a mouse on a wide window)', !/\.rl-link|\.hub-more|\.more-link|\.cnf-cite::after|\.atl-ptl-row>a::after|\.cnf-rel li>a|\.cnf-src li>a/.test(before));

ok('a tradition’s Relationships and Texts lists take away the left room of a .plain list, so they also take away its bullet dot (it sat on the first characters of every entry)', /\.atl-inter li\{padding:7px 0;[^}]*\} \.atl-texts li\{padding:9px 0;[^}]*\} \.atl-inter li:before,\.atl-texts li:before\{display:none\}/.test(plain));

/* ── the markup carries the classes the rules need ── */
const pg = src('6q-atlas-pages.js');
ok('a tradition’s page: the other tradition of a relationship, a practice link and “N more in the catalogue” sit in a div or paragraph with the class the rule needs', /<div class="small rl-link"><a href="#\/atlas\/tradition\/\$\{o\}">/.test(pg) && /<div class="rl-link"><a href="\$\{ATL_PRACTICE_LINKS\[p\.id\]\[0\]\}">/.test(pg) && /<p class="small hub-more"><a href="#\/atlas\/texts\?t=\$\{id\}">\$\{texts\.length - 14\} more in the catalogue<\/a><\/p>/.test(pg));
ok('“N more in the family tree” (a tradition’s page) and “All shared ideas →” (a Journey view) carry the class more-link', /<a class="small more-link" href="#\/traditions\/tree\?open=\$\{t\.id\}">\$\{kids\.length - 14\} more in the family tree<\/a>/.test(src('6zz-traditions.js')) && /<a class="small more-link" href="#\/path\/echoes">All shared ideas →<\/a>/.test(src('6e-traditions.js')));
{ const all = fs.readdirSync(path.join(__dirname, '../src/js')).filter((f) => /\.js$/.test(f)); let n = 0; const files = [];
  all.forEach((f) => { const c = (src(f).match(/<div class="small" style="margin-bottom:10px"><a href="[^"]*">←/g) || []).length; if (c) { n += c; files.push(f); } });
  ok('the back lines of the pages (the Journey view, the tradition families, the stories, the pictures, the passage sets, the motifs, the Library and the others) all keep the inline style the rule selects: at least twelve of them in at least ten files', n >= 12 && files.length >= 10, [n, files]); }
const cf = src('6zzd-conflicts.js');
ok('a conflict’s own back line has the class cnf-back, and its related conflicts and its sources are lists of the classes cnf-rel and cnf-src', /<p class="small cnf-back"><a href="\$\{esc\(cnfHref\(st\)\)\}" data-cnf="list">← All conflicts and settlements<\/a><\/p>/.test(cf) && /class="plain cnf-rel"/.test(cf) && /class="plain cnf-src"/.test(cf));

console.log(`tap, pages reached from a link: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
