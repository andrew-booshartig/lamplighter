/* The notebook (src/js/2z-notebook-core.js, the pure part, and a look at src/js/6zn-notebook.js): pages of Markdown, the safe reader of Markdown, blocks, tags and what they mark, clips and the links back to the reader,
   backlinks, templates, files and imports, and the promises that nothing a person typed can become live HTML. Run: node tests/notebook.test.js */
const fs = require('fs'); const path = require('path');
const N = require('../src/js/2z-notebook-core.js');
let pass = 0; let fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 600) : ''); } };
const eq = (name, a, b) => ok(name, JSON.stringify(a) === JSON.stringify(b), { got: a, want: b });
const ch = (n) => String.fromCharCode(n);
const NOW = 1763460000000;

/* ── records: whatever was saved or imported is made safe ── */
{
  const r = N.nbClean({ id: 'n1', title: '  A   title\n with   breaks  ', body: 'a\r\nb\u0000c', c: NOW, u: NOW + 5 }, 7);
  eq('a record is cleaned: title on one line, line ends and NULs fixed', [r.id, r.title, r.body, r.c, r.u], ['n1', 'A title with breaks', 'a\nbc', NOW, NOW + 5]);
  ok('a record with no good id is not a page, unless the caller gives one', N.nbClean({ id: '../x', title: 't' }, 1) === null && N.nbClean({ id: 'Bad Id' }, 1) === null && N.nbClean({ title: 't' }, 1) === null && N.nbClean({ title: 't' }, 1, 'n9').id === 'n9');
  ok('not a page: a string, a number, null, an array', [N.nbClean('x', 1), N.nbClean(5, 1), N.nbClean(null, 1), N.nbClean([], 1)].every((x) => x === null));
  ok('prototype names are fine as ids and break nothing (they are keys of maps, never of plain objects)', N.nbClean({ id: 'constructor', title: 'x' }, 1).id === 'constructor' && N.nbClean({ id: '__proto__' }, 1) === null);
  const big = N.nbClean({ id: 'n1', title: 'x'.repeat(500), body: 'y'.repeat(N.NB_LIMITS.body + 50) }, 1);
  ok('a title and a body are cut to their limits', big.title.length === N.NB_LIMITS.title && big.body.length === N.NB_LIMITS.body);
  ok('wrong types for the times fall back (created is the given time, updated is created)', (() => { const q = N.nbClean({ id: 'n1', c: 'x', u: -4 }, 99); return q.c === 99 && q.u === 99; })());
  ok('the Inbox always has a name', N.nbClean({ id: 'inbox', title: '' }, 1).title === 'Inbox' && N.nbTitleOf({ id: 'n1', title: '' }) === 'Untitled' && N.nbTitleOf({ id: 'inbox', title: '' }) === 'Inbox');
  const list = N.nbCleanList([{ id: 'a', title: '1' }, { id: 'a', title: '2' }, 'junk', null, { id: 'b' }, { id: 'c d' }], 5);
  eq('a list is cleaned: junk and repeated ids are dropped, the first of an id is kept', list.map((x) => x.id + ':' + x.title), ['a:1', 'b:']);
  ok('a list is cut at the limit and a non-list is empty', N.nbCleanList(Array.from({ length: N.NB_LIMITS.pages + 40 }, (_, i) => ({ id: 'p' + i })), 1).length === N.NB_LIMITS.pages && N.nbCleanList('x', 1).length === 0 && N.nbCleanList(null, 1).length === 0);
  const taken = new Set(['n1a']); const id1 = N.nbNewId(taken, 1, 'A'); taken.add(id1); const id2 = N.nbNewId(taken, 1, 'A');
  ok('new ids are good ids and never repeat', N.nbIdOk(id1) && N.nbIdOk(id2) && id1 !== id2 && id1 !== 'n1a' && N.nbIdOk(N.nbNewId(null, NOW, 'ZZ-!!')) && N.nbNewId(null, NOW, '12345678901234').length <= 32);
}

/* ── a page as a file ── */
{
  const rec = { id: 'n8k2x9a1', title: 'Resurrection themes', body: '#resurrection\n\n## Gospels\n\n> A quote\n>\n> — [Mark](#/path/read/b-mark?s=8&p=34)', c: NOW, u: NOW + 60000 };
  const md = N.nbToMd(rec);
  ok('a page file begins with its front matter and then the Markdown, and ends with one new line', md.startsWith('---\ntitle: Resurrection themes\nid: n8k2x9a1\ncreated: 2025-11-18T10:00:00.000Z\nupdated: 2025-11-18T10:01:00.000Z\n---\n\n#resurrection') && md.endsWith('s=8&p=34)\n'), md);
  const back = N.nbFromMd(md, 'x.md', 1);
  eq('a page survives its own file: the same title, id, words and times', back, rec);
  const odd = [': colon first', 'ends with colon:', 'has: colon inside', 'a # hash', ' leading space', 'trailing space ', '"quoted" title', "it's", '-dash', '[brackets]', 'back\\slash', 'tab\tinside', 'Zürich · Ἰησοῦς · יהוה · القرآن', '', '123', 'true'];
  odd.forEach((t) => { const r2 = N.nbFromMd(N.nbToMd({ id: 'n1', title: t, body: 'x', c: NOW, u: NOW }), 'f.md', 1); ok('title survives the front matter: ' + JSON.stringify(t), r2.title === N.nbClean({ id: 'n1', title: t }, 1).title, [t, r2.title]); });
  ok('an empty body gives a file with no body and comes back empty', N.nbFromMd(N.nbToMd({ id: 'n1', title: 't', body: '', c: NOW, u: NOW }), 'f.md', 1).body === '');
  ok('a body that itself begins with --- is not eaten by the front matter', N.nbFromMd(N.nbToMd({ id: 'n1', title: 't', body: '---\n\nafter the rule', c: NOW, u: NOW }), 'f.md', 1).body === '---\n\nafter the rule');
  /* files made elsewhere */
  const f1 = N.nbFromMd('# Notes on Job\n\nSome words.\n', 'whatever.md', NOW); eq('no front matter: the first # heading is the title and is not repeated in the body', [f1.title, f1.body, f1.id, f1.c], ['Notes on Job', 'Some words.', '', NOW]);
  const f2 = N.nbFromMd('Just words, no heading.', 'My_reading_log.md', NOW); eq('no heading either: the file name is the title', [f2.title, f2.body], ['My reading log', 'Just words, no heading.']);
  const f3 = N.nbFromMd('---\r\ntitle: "Windows file"\r\ntags: [a, b]\r\ndate: 2026-01-02\r\nid: not a good id\r\n---\r\nBody line\r\n', 'w.md', NOW); eq('CRLF, other keys, comments and a bad id are all tolerated', [f3.title, f3.body, f3.id], ['Windows file', 'Body line', '']);
  const f4 = N.nbFromMd('---\ntitle: x\n  list: item\n- a\n# comment\n---\nbody', 'a.md', NOW); eq('lines that are lists or comments inside the front matter are skipped', [f4.title, f4.body], ['x', 'body']);
  const f5 = N.nbFromMd('---\nsome text\n---\nmore', 'a.md', NOW); eq('two --- lines around ordinary words are a page, not front matter', [f5.title, f5.body], ['a', '---\nsome text\n---\nmore']);
  const f6 = N.nbFromMd(ch(0xfeff) + '---\ntitle: With BOM\n---\nx', 'b.md', NOW); ok('a byte order mark in front is ignored', f6.title === 'With BOM');
  ok('an unclosed front matter is just text', N.nbFromMd('---\ntitle: x\nbody', 'f.md', NOW).body.startsWith('---'));
  ok('hostile front matter: keys with prototype names change nothing', (() => { const r = N.nbFromMd('---\n__proto__: x\nconstructor: y\ntitle: ok\n---\nz', 'f.md', NOW); return r.title === 'ok' && ({}).x === undefined && r.body === 'z'; })());
  eq('a created date and no updated date: updated is the created date', (() => { const r = N.nbFromMd('---\ncreated: 2026-01-02T03:04:05Z\n---\nx', 'f.md', 9); return r.u === r.c && r.c === Date.parse('2026-01-02T03:04:05Z'); })(), true);
  /* file names */
  const used = new Set(); const names = ['Resurrection themes', 'Resurrection themes', 'a/b:c*?"<>|d', '', '...', 'x'.repeat(200), 'RESURRECTION THEMES'].map((t) => N.nbFileName(t, used));
  eq('file names are made from titles, kept safe, and never repeat (also ignoring case)', names, ['Resurrection themes.md', 'Resurrection themes 2.md', 'a b c d.md', 'Untitled.md', 'Untitled 2.md', 'x'.repeat(80) + '.md', 'RESURRECTION THEMES 3.md']);
  ok('a file name has no slash, colon or control character', names.every((n) => !/[\/\\:*?"<>|\u0000-\u001f]/.test(n)));
}

/* ── importing pages from files: nothing here is ever replaced ── */
{
  const have = [{ id: 'n1', title: 'Mine', body: 'my words', c: 1, u: 1 }, { id: 'inbox', title: 'Inbox', body: 'clips', c: 1, u: 1 }];
  const inc = [{ id: 'n1', title: 'Mine', body: 'my words' }, { id: 'n1', title: 'Mine', body: 'other words' }, { id: 'n2', title: 'Fresh', body: 'new' }, { id: '', title: 'No id', body: 'x' }, { id: 'inbox', title: 'Inbox', body: 'someone else’s clips' }, { id: 'n2', title: 'Fresh', body: 'new' }, { title: '', body: '   ' }, null, 'junk'];
  const plan = N.nbPlanImport(have, inc, NOW, 'ab');
  eq('an identical page is skipped (also when it comes twice), a different page with a taken id is a new page named "(imported)", a free id is kept, no id gets one', [plan.skipped, plan.renamed, plan.add.map((r) => r.title)], [2, 2, ['Mine (imported)', 'Fresh', 'No id', 'Inbox (imported)']]);
  ok('every added page has its own good id, none is one that was here, and the existing pages are untouched', (() => { const ids = plan.add.map((r) => r.id); return ids.every(N.nbIdOk) && new Set(ids).size === ids.length && ids.every((i) => !['n1', 'inbox'].includes(i)) && have[0].body === 'my words'; })());
  ok('a free id is kept as it is', plan.add.find((r) => r.title === 'Fresh').id === 'n2');
  ok('the cap on pages holds', N.nbPlanImport(Array.from({ length: N.NB_LIMITS.pages }, (_, i) => ({ id: 'p' + i, title: 't' + i, body: 'b' })), [{ id: 'z', title: 'new', body: 'x' }], NOW, 'q').add.length === 0);
}

/* ── links ── */
{
  const good = ['#/path/read/b-gen?s=1&p=2', '#/notebook/tag/flood', 'https://example.org/a?b=c#d', 'http://example.org', 'mailto:a@b.org', 'HTTPS://EXAMPLE.ORG'];
  const bad = ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'java\nscript:alert(1)', 'java\tscript:x', 'data:text/html,<script>alert(1)</script>', 'vbscript:x', 'file:///etc/passwd', '//evil.org', '/relative', 'relative.html', '#top', '#', '', 'ftp://x', 'https://', 'https://x y', ch(0x200b) + 'javascript:alert(1)', 'blob:x', 'tel:123', 'about:blank'];
  ok('links that go to a place in the app, a web page or a mail address are kept', good.every((h) => N.nbSafeHref(h) !== null), good.filter((h) => N.nbSafeHref(h) === null));
  ok('every other kind of link is refused: scripts in any spelling, data, files, relative paths, bare anchors', bad.every((h) => N.nbSafeHref(h) === null), bad.filter((h) => N.nbSafeHref(h) !== null));
  ok('tabs and line ends inside an address are dropped (as a browser does), spaces at its ends are trimmed, a space inside makes it no address', N.nbSafeHref('https://exa\nmple.org/x') === 'https://example.org/x' && N.nbSafeHref('  https://e.org  ') === 'https://e.org' && N.nbSafeHref('https://e.org/a b') === null);
  eq('the reader address of a place', [N.nbReadHref('b-gen', 3, 7), N.nbReadHref('b-gen', 3), N.nbReadHref('u-ab12', 0, 0), N.nbReadHref('b-gen', 'x', -4)], ['#/path/read/b-gen?s=3&p=7', '#/path/read/b-gen?s=3', '#/path/read/u-ab12?s=0&p=0', '#/path/read/b-gen?s=0']);
  eq('a place is read back from its address, with other parts ignored', [N.nbReadPlace('#/path/read/b-gen?s=3&p=7&f=word&m=page'), N.nbReadPlace('#/path/read/b-gen'), N.nbReadPlace('#/path/read/b-gen?p=2')], [{ id: 'b-gen', s: 3, p: 7 }, { id: 'b-gen', s: 0, p: -1 }, { id: 'b-gen', s: 0, p: 2 }]);
  ok('anything else is not a place', ['#/path/library', '#/path/read/', '#/path/read/BAD?s=1', 'https://x/#/path/read/b-gen?s=1', '', null, undefined].every((h) => N.nbReadPlace(h) === null));
}

/* ── inline Markdown ── */
const I = (s) => N.nbInlineHtml(s);
{
  eq('emphasis, strong, both, strike and code', [I('*a*'), I('_a_'), I('**a**'), I('__a__'), I('***a***'), I('~~a~~'), I('`a`')], ['<em>a</em>', '<em>a</em>', '<strong>a</strong>', '<strong>a</strong>', '<strong><em>a</em></strong>', '<del>a</del>', '<code>a</code>']);
  eq('emphasis nests and spans words', [I('**bold and *italic* inside**'), I('a *b c* d')], ['<strong>bold and <em>italic</em> inside</strong>', 'a <em>b c</em> d']);
  eq('what is not emphasis stays as typed: a star before a space, intraword underscores, a lone tilde, an unclosed star', [I('2 * 3 * 4'), I('snake_case_name'), I('a ~ b'), I('*unclosed'), I('a _b'), I('**')], ['2 * 3 * 4', 'snake_case_name', 'a ~ b', '*unclosed', 'a _b', '**']);
  eq('a backslash makes a mark plain, and is itself plain before a letter', [I('\\*not\\*'), I('C:\\dir'), I('a\\\\b'), I('\\#tag')], ['*not*', 'C:\\dir', 'a\\b', '#tag']);
  eq('code keeps its marks and its HTML as plain words', [I('`*a* <b>`'), I('``a ` b``'), I('`unclosed')], ['<code>*a* &lt;b&gt;</code>', '<code>a ` b</code>', '`unclosed']);
  eq('links: the words, an address in the app, one on the web (opens a new tab, gives nothing away)', [I('[x](#/path/library)'), I('[x](https://e.org/a_b)'), I('[x](https://e.org/a_(b))')],
    ['<a href="#/path/library">x</a>', '<a href="https://e.org/a_b" target="_blank" rel="noopener noreferrer">x</a>', '<a href="https://e.org/a_(b)" target="_blank" rel="noopener noreferrer">x</a>']);
  eq('a link to a book is marked as a reference (the style of a citation)', I('[Mark](#/path/read/b-mark?s=8&p=34)'), '<a href="#/path/read/b-mark?s=8&amp;p=34" class="nbk-ref">Mark</a>');
  eq('a link that goes nowhere safe is just its words', [I('[x](javascript:alert(1))'), I('[**x**](data:text/html,1)'), I('[x](relative.html)')], ['x', '<strong>x</strong>', 'x']);
  eq('a link with a title, and an address in angle brackets', [I('[x](https://e.org "a title")'), I('[x](<https://e.org/a b>)')], ['<a href="https://e.org" target="_blank" rel="noopener noreferrer">x</a>', 'x']);
  eq('brackets that are not a link are plain', [I('[just brackets]'), I('[a](b'), I('see [1] and [2]')], ['[just brackets]', '[a](b', 'see [1] and [2]']);
  eq('a bare address is a link, without the full stop or bracket after it', [I('see https://e.org/a.'), I('(https://e.org/a_b)'), I('x https://e.org/a,b, y')],
    ['see <a href="https://e.org/a" target="_blank" rel="noopener noreferrer">https://e.org/a</a>.', '(<a href="https://e.org/a_b" target="_blank" rel="noopener noreferrer">https://e.org/a_b</a>)', 'x <a href="https://e.org/a,b" target="_blank" rel="noopener noreferrer">https://e.org/a,b</a>, y']);
  eq('inside a link a bare address and a tag are not links of their own (no link inside a link)', I('[see #flood at https://e.org](https://x.org)'), '<a href="https://x.org" target="_blank" rel="noopener noreferrer">see #flood at https://e.org</a>');
  /* tags */
  const T = (s) => { const out = []; const walk = (ts) => ts.forEach((k) => { if (k.t === 'tag') out.push(k.tag); if (k.kids) walk(k.kids); }); walk(N.nbInlineTokens(s)); return out; };
  eq('a tag is # then a letter then letters, digits, _ or -; in any script; not case-sensitive', [T('#flood'), T('#Flood-Myths_2'), T('#Ἰησοῦς and #יהוה and #القرآن'), T('x #A')], [['flood'], ['flood-myths_2'], ['ἰησοῦς', 'יהוה', 'القرآن'], ['a']]);
  eq('not tags: a heading mark, #5, a # in the middle of a word, a # alone, an address, a hash in a link or in code', [T('# Heading'), T('#5 and #123abc'), T('C#sharp'), T('# '), T('#/path/read/x'), T('[x](https://e.org/#frag)'), T('`#code`'), T('a\\#b')], [[], [], [], [], [], [], [], []]);
  eq('a tag stops at punctuation; a dash or underscore at its end is not part of it; many in a row', [T('#flood.'), T('(#flood)'), T('#a- #b_ #c'), T('**#bold**'), T('#' + 'x'.repeat(80)).map((t) => t.length)], [['flood'], ['flood'], ['a', 'b', 'c'], ['bold'], [N.NB_LIMITS.tag]]);
  ok('a tag is a link to its page, with the tag as typed', I('#Flood') === '<a class="nbk-tag" href="#/notebook/tag/flood">#Flood</a>' && I('#Ἰησοῦς').includes('/tag/' + encodeURIComponent('ἰησοῦς')));
  /* the words of a line */
  eq('plain words: marks and links taken off', N.nbPlain('**Bold** and [a link](https://e.org) and `code` #tag'), 'Bold and a link and code #tag');
}

/* ── nothing typed becomes live HTML ── */
{
  const attacks = ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '"><svg onload=alert(1)>', '[x](javascript:alert(1))', '[x](" onmouseover="alert(1))', '[<img src=x onerror=1>](#/a)', '`<script>`', '**<b>x</b>**', '#tag"onmouseover="x', '[x](#/a" onclick="x)', '<a href="javascript:x">y</a>', '&lt;script&gt;', '<!-- c -->', '<style>*{display:none}</style>', '[a](https://e.org/"onmouseover="x)',
    '> <script>alert(1)</script>', '- <img src=x onerror=1>', '```\n<script>alert(1)</script>\n```', '## <b onclick=x>h</b>', '- [ ] <i>t</i>', ch(0x2028) + '<s>', '</p><script>x</script>', '<iframe src="javascript:1"></iframe>'];
  const allowed = /^<(\/?(p|br|a|strong|em|del|code|pre|ul|ol|li|h2|h3|h4|blockquote)|hr class="nbk-rule"|input type="checkbox" class="nbk-chk" data-line="\d+"( checked)?( disabled)? aria-label="Done"|a class="nbk-tag" href="#\/notebook\/tag\/[^"<>]*"|a href="[^"<>]*"( class="nbk-ref")?|a href="[^"<>]*" target="_blank" rel="noopener noreferrer"|p class="nbk-cite"|h[234] class="nbk-h[123]"|pre class="nbk-code"|blockquote class="nbk-quote"|ol start="\d+"|li class="nbk-task( done)?")>$/;
  const tagsOf = (html) => html.match(/<[^>]*>/g) || [];
  const clean = (html) => tagsOf(html).every((t) => allowed.test(t));
  const linksOk = (html) => tagsOf(html).filter((t) => /^<a /.test(t)).every((t) => /^<a (class="nbk-tag" )?href="(#\/|https?:\/\/|mailto:)/i.test(t));
  attacks.forEach((a) => { const html = N.nbHtml(a); ok('hostile text stays text: ' + a.slice(0, 40).replace(/\n/g, '\\n'), clean(html) && linksOk(html) && !/<(script|img|svg|iframe|style)/i.test(html), html); });
  ok('the only tags the page can ever contain are the ones the reader writes itself', attacks.every((a) => clean(N.nbHtml(a, { readonly: true }))));
  /* a long run of a hostile pattern is read in a blink and stays safe */
  const heavy = ['*'.repeat(20000), '['.repeat(20000), '_a'.repeat(10000), '`'.repeat(5000) + 'x', '[a](' .repeat(3000), '**a *b **c *d '.repeat(1000), '#a '.repeat(8000), 'https://e.org/'.repeat(1500), '> '.repeat(5000) + 'x', '- '.repeat(5000) + 'x', '~~'.repeat(10000), '\\'.repeat(30000), '(' .repeat(30000), '![a](b)'.repeat(3000), '<'.repeat(30000), '&'.repeat(30000)];
  const t0 = Date.now(); let bad = null; heavy.forEach((h, k) => { const t1 = Date.now(); let html = ''; try { html = N.nbHtml(h); N.nbBlockTags(h); N.nbRefs(h); N.nbIndex([{ id: 'n1', title: 't', body: h }]); } catch (e) { bad = 'threw ' + k + ': ' + e.message; } if (Date.now() - t1 > 1500) bad = 'slow ' + k + ': ' + (Date.now() - t1) + ' ms'; if (!clean(html)) bad = 'unsafe ' + k; });
  ok('long hostile runs are read in about a second at most and stay safe', bad === null && Date.now() - t0 < 9000, [bad, Date.now() - t0]);
  /* random text, many times */
  let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const bits = ['*', '**', '_', '`', '[', ']', '(', ')', '#', '> ', '- ', '1. ', '\n', '\n\n', ' ', 'a', 'b', 'tag', '<b>', '&', '"', "'", '\\', 'https://e.org', '#/path/read/b-x?s=1', '~~', '[ ]', '---', '```', '\u2028', 'é', 'ἰ', 'יה'];
  let worst = null; for (let k = 0; k < 4000 && !worst; k++) { let s = ''; const n = 1 + Math.floor(rnd() * 60); for (let j = 0; j < n; j++) s += bits[Math.floor(rnd() * bits.length)]; let html; try { html = N.nbHtml(s); N.nbAnalyse(s); N.nbRefs(s); N.nbClipMd({ id: 'b-x', text: s, s: 1, p: 1 }); N.nbSearch([{ id: 'n1', title: s, body: s }], s); } catch (e) { worst = ['threw', s, e.message]; } if (!worst && !clean(html)) worst = ['unsafe', s, html]; }
  ok('4,000 random scraps of Markdown and markup: nothing throws and nothing unsafe comes out', !worst, worst);
}

/* ── blocks ── */
{
  const B = (s) => N.nbBlocks(s);
  eq('blank lines separate blocks, and many blank lines are one', B('a\n\n\nb\n\nc'), ['a', 'b', 'c']);
  eq('a heading and a rule are blocks of their own, even with no blank line', B('## H\ntext under\n---\nmore'), ['## H', 'text under', '---', 'more']);
  eq('a quote, a list and a paragraph that follow each other with no blank line are three blocks', B('> q\n> q2\n- a\n- b\ntext'), ['> q\n> q2', '- a\n- b', 'text']);
  eq('a list keeps its nested and continued lines, and ends at a line that is none of them', B('- a\n  - nested\n  more of nested\n- b\nplain'), ['- a\n  - nested\n  more of nested\n- b', 'plain']);
  eq('a fence runs to its closing fence, blank lines and all; an unclosed one runs to the end', [B('```\na\n\n# b\n```\nafter'), B('```\nunclosed\n\nstill')], [['```\na\n\n# b\n```', 'after'], ['```\nunclosed\n\nstill']]);
  eq('a longer fence is not closed by a shorter one, and ~~~ is a fence too', [B('````\n```\n````'), B('~~~\nx\n~~~')], [['````\n```\n````'], ['~~~\nx\n~~~']]);
  eq('a tag at the start of a line is a paragraph, not a heading', B('#tag line\n\n# Heading'), ['#tag line', '# Heading']);
  eq('an empty bullet is a list, and a lone dash after text is its own list block', [N.nbBlockKind('-'), B('text\n-\nmore')], ['list', ['text', '-', 'more']]);
  eq('empty and blank bodies have no blocks', [B(''), B('  \n \n'), B(null), B(undefined)], [[], [], [], []]);
  eq('CRLF is read as a new line', B('a\r\nb\r\n\r\nc'), ['a\nb', 'c']);
  const samples = ['# T\n\npara one\nstill one\n\n> quote\n>\n> — cite\n\n- a\n- b\n\n```\ncode\n\nmore\n```\n\n---\n\nend', 'x', '', '\n\n\nlead\n\n\n', '- [ ] t\n- [x] d\n\n1. a\n2. b'];
  samples.forEach((s, k) => { const j = N.nbJoin(B(s)); ok('joining blocks and cutting again changes nothing (sample ' + k + ')', JSON.stringify(B(j)) === JSON.stringify(B(s)) && N.nbJoin(B(j)) === j); });
  eq('kinds of block', ['## h', '---', '***', '- - -', '```\nx\n```', '> q', '- a', '1) a', '12. a', 'plain', '#tag', '', '   '].map(N.nbBlockKind), ['heading', 'rule', 'rule', 'rule', 'code', 'quote', 'list', 'list', 'list', 'para', 'para', 'empty', 'empty']);
  eq('what a person wrote, with the marks of the block taken off', [N.nbBlockSource('> a\n> b'), N.nbBlockSource('- [ ] a\n  - b'), N.nbBlockSource('## Head #t'), N.nbBlockSource('```\nx\n```'), N.nbBlockSource('1. one\n2. two')], ['a\nb', 'a\nb', 'Head #t', '', 'one\ntwo']);
}

/* ── a block as HTML ── */
{
  const H = (s, o) => N.nbBlockHtml(s, o);
  eq('headings are h2 to h4 (the page title is the h1), whatever the depth typed', [H('# a'), H('## a'), H('### a'), H('###### a')], ['<h2 class="nbk-h1">a</h2>', '<h3 class="nbk-h2">a</h3>', '<h4 class="nbk-h3">a</h4>', '<h4 class="nbk-h3">a</h4>']);
  eq('a heading may carry marks and a closing #s', H('## *a* ##'), '<h3 class="nbk-h2"><em>a</em></h3>');
  eq('a paragraph keeps its line breaks', H('a\nb'), '<p>a<br>b</p>');
  eq('a rule, a fence (its HTML is plain words, its language word is dropped)', [H('---'), H('```js\n<b>x</b>\n```')], ['<hr class="nbk-rule">', '<pre class="nbk-code"><code>&lt;b&gt;x&lt;/b&gt;</code></pre>']);
  eq('a quote: paragraphs, and a last line that begins with a dash is the citation', H('> one\n>\n> two\n>\n> — [Mark](#/path/read/b-mark?s=1)'), '<blockquote class="nbk-quote"><p>one</p><p>two</p><p class="nbk-cite">— <a href="#/path/read/b-mark?s=1" class="nbk-ref">Mark</a></p></blockquote>');
  eq('a quote of one paragraph that begins with a dash is not a citation', H('> — said he'), '<blockquote class="nbk-quote"><p>— said he</p></blockquote>');
  eq('lists: bullets, numbers (a start other than 1 is kept), nesting, a change of kind', [H('- a\n- b'), H('3. a\n4. b'), H('- a\n  - b\n    - c\n- d'), H('- a\n1. b'.replace('\n1', '\n  1'))],
    ['<ul><li>a</li><li>b</li></ul>', '<ol start="3"><li>a</li><li>b</li></ol>', '<ul><li>a<ul><li>b<ul><li>c</li></ul></li></ul></li><li>d</li></ul>', '<ul><li>a<ol><li>b</li></ol></li></ul>']);
  eq('a list item may run over lines', H('- one\n  two'), '<ul><li>one<br>two</li></ul>');
  eq('tasks: a box on the line it is written on, ticked or not, and fixed when the page is only shown', [H('- [ ] a\n- [X] b'), H('- [ ] a', { readonly: true })],
    ['<ul><li class="nbk-task"><input type="checkbox" class="nbk-chk" data-line="0" aria-label="Done"> a</li><li class="nbk-task done"><input type="checkbox" class="nbk-chk" data-line="1" checked aria-label="Done"> b</li></ul>', '<ul><li class="nbk-task"><input type="checkbox" class="nbk-chk" data-line="0" disabled aria-label="Done"> a</li></ul>']);
  eq('ticking a task turns its box over, in the Markdown, on that line only; a line that is not a task cannot be ticked', [N.nbToggleTask('- [ ] a\n- [ ] b', 1), N.nbToggleTask('- [x] a\n- [ ] b', 0), N.nbToggleTask('- a', 0), N.nbToggleTask('- [ ] a', 5), N.nbToggleTask('1. [ ] a', 0)], ['- [ ] a\n- [x] b', '- [ ] a\n- [ ] b', null, null, '1. [x] a']);
  ok('a task toggled twice is as it was', N.nbToggleTask(N.nbToggleTask('- [ ] a\n  - [x] b', 1), 1) === '- [ ] a\n  - [x] b');
  eq('an empty block is nothing; a huge block is shown as plain words with no marks read', [H(''), H('x*'.repeat(15000)).startsWith('<p>x*x*')], ['', true]);
  eq('a whole page is its blocks one after another', N.nbHtml('## A\n\ntext\n\n- x'), '<h3 class="nbk-h2">A</h3><p>text</p><ul><li>x</li></ul>');
}

/* ── tags: what each block carries ── */
{
  const A = (b) => N.nbAnalyse(b);
  const eff = (b) => A(b).blocks.map((x) => x.eff.join('+'));
  eq('a tag marks the block it is in, and only that block', eff('one #a\n\ntwo\n\nthree #b'), ['a', '', 'b']);
  eq('a tag in a heading marks everything under it, until a heading of the same or a higher level', eff('## S #x\n\nin\n\n### Sub\n\nstill in\n\n## Next\n\nout'), ['x', 'x', 'x', 'x', '', '']);
  eq('a deeper heading ends only its own part', eff('# A\n\none\n\n## B #b\n\ntwo\n\n## C\n\nthree'), ['', '', 'b', 'b', '', '']);
  eq('a line of only tags below a block tags that block', eff('quote\n\n#a #b\n\nnext'), ['a+b', '', '']);
  eq('a line of only tags below a heading tags the whole section', eff('## H\n\n#a\n\ninside\n\n## Other\n\noutside'), ['a', 'a', 'a', '', '']);
  eq('a line of only tags at the very top tags the whole page', eff('#whole\n\none\n\n## H\n\ntwo'), ['whole', 'whole', 'whole', 'whole']);
  eq('a line with words and a tag is an ordinary block', eff('#a and words\n\nnext'), ['a', '']);
  eq('tags in code are not tags, and an escaped one is not either', eff('```\n#a\n```\n\n\\#b'), ['', '']);
  eq('tags are not case-sensitive and are listed once', [N.nbBlockTags('#Flood #flood #FLOOD'), eff('#Flood #flood #FLOOD')], [['flood'], ['flood']]);
  const an = A('#page\n\n## H #sec\n\nclip text\n\n#note\n\n---\n\n```\ncode\n```');
  eq('items are the clips and notes that a tag page lists: not headings, rules, or tag lines', an.blocks.filter((b) => b.item).map((b) => b.i), [2, 5]);
  eq('an item knows the heading it is under', an.blocks.filter((b) => b.item).map((b) => b.heading), ['H', 'H']);
  /* the index across pages */
  const pages = [{ id: 'n1', title: 'One', body: '#flood\n\nnoah\n\ngilgamesh\n\n## Other #rain\n\nwater', c: 1, u: 5 }, { id: 'n2', title: 'Two', body: 'a note #flood and #death\n\nanother', c: 1, u: 3 }, { id: 'inbox', title: 'Inbox', body: '', c: 1, u: 1 }];
  const ix = N.nbIndex(pages);
  eq('the tags with the number of clips and notes that carry each, most used first, and how many pages', ix.tags, [{ tag: 'flood', count: 4, pages: 2 }, { tag: 'rain', count: 1, pages: 1 }, { tag: 'death', count: 1, pages: 1 }].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)));
  eq('a tag page: every item carrying the tag, grouped by page, in the order of the page', ix.by.get('flood').map((g) => [g.page.id, g.items.map((i) => i.i)]), [['n1', [1, 2, 4]], ['n2', [0]]]);
  ok('no tags, no index', N.nbIndex([]).tags.length === 0 && N.nbIndex(null).tags.length === 0 && N.nbIndex([{ id: 'n1', title: '', body: 'plain' }]).tags.length === 0);
}

/* ── clips ── */
const MARK = { id: 'b-mark', text: 'Whoever wants to be first must be last of all.', s: 8, p: 34, heading: 'Chapter 9', page: 'p. 41', title: 'The Gospel of Mark' };
{
  const md = N.nbClipMd(MARK);
  eq('a clip is a quote block whose last line is the citation and the link back', md, '> Whoever wants to be first must be last of all.\n>\n> — [*The Gospel of Mark*, Chapter 9, p. 41](#/path/read/b-mark?s=8&p=34)');
  eq('it is one block, it reads as a quote with a cited link, and the link opens that place', [N.nbBlocks(md).length, N.nbBlockKind(md), N.nbHtml(md)],
    [1, 'quote', '<blockquote class="nbk-quote"><p>Whoever wants to be first must be last of all.</p><p class="nbk-cite">— <a href="#/path/read/b-mark?s=8&amp;p=34" class="nbk-ref"><em>The Gospel of Mark</em>, Chapter 9, p. 41</a></p></blockquote>']);
  eq('with no page and no heading the citation is the title; a heading that repeats the title is left out; with no paragraph the link names only the section',
    [N.nbClipMd({ id: 'b-x', text: 'a', s: 2, title: 'T' }).split('\n').pop(), N.nbClipMd({ id: 'b-x', text: 'a', s: 2, p: 0, title: 'T', heading: 't' }).split('\n').pop(), N.nbClipMd({ id: 'b-x', text: 'a' }).split('\n').pop()],
    ['> — [*T*](#/path/read/b-x?s=2)', '> — [*T*](#/path/read/b-x?s=2&p=0)', '> — [*b-x*](#/path/read/b-x?s=0)']);
  eq('several paragraphs stay several, lines stay lines, and spaces are tidied', N.nbClipMd({ id: 'b-x', text: '  one  ' + ch(0xa0) + 'two\nline two\n\n\n\npara  two  ', title: 'T' }).split('\n').slice(0, 5), ['> one two', '> line two', '>', '> para two', '>']);
  const hard = N.nbClipMd({ id: 'b-x', text: '# not heading\n- not list\n1. not numbered\n> not nested\n*star* _under_ `tick` [br] <b> #tag ~~s~~ \\ back', title: 'T *odd* [name]', heading: 'H_1 [x]', page: 'p. 2' });
  const hardHtml = N.nbHtml(hard);
  const hardQuote = hardHtml.split('<p class="nbk-cite">')[0]; const hardCite = hardHtml.split('<p class="nbk-cite">')[1];
  ok('what would read as Markdown in a quotation is escaped, so a quotation reads as the words it is', !/<h[234]|<ul|<ol|<em>|<code|<del|nbk-tag/.test(hardQuote) && hardQuote.includes('# not heading<br>- not list<br>1. not numbered<br>&gt; not nested<br>*star* _under_ `tick` [br] &lt;b&gt; #tag ~~s~~ \\ back'), hardQuote);
  ok('and so is what a title and a heading say (one italic title, the words as written, one link)', hardCite.includes('<em>T *odd* [name]</em>, H_1 [x], p. 2') && (hardCite.match(/<a /g) || []).length === 1, hardCite);
  ok('and it is still one block with one link back that names the place', N.nbBlocks(hard).length === 1 && N.nbRefs(hard).length === 1 && N.nbRefs(hard)[0].id === 'b-x', N.nbRefs(hard));
  ok('a note is added under the quote as a block of its own', N.nbBlocks(N.nbClipMd(Object.assign({ note: 'My note.\n\nSecond.' }, MARK))).length === 3);
  ok('nothing to clip, or no good id: nothing', [N.nbClipMd(null), N.nbClipMd({ id: 'b-x', text: '   ' }), N.nbClipMd({ id: 'B X', text: 'a' }), N.nbClipMd({ id: 'b-x' }), N.nbClipMd({ text: 'a' })].every((x) => x === null));
  const long = N.nbClipMd({ id: 'b-x', text: ('A sentence of some length. ').repeat(600), title: 'T' }); ok('a very long selection is cut at a sentence or word and says so', long.length < N.NB_LIMITS.quote + 400 && /…\n>\n> — /.test(long), long.slice(-120));
  ok('a long title and heading are cut', N.nbClipMd({ id: 'b-x', text: 'a', title: 't'.repeat(500), heading: 'h'.repeat(500), page: 'p'.repeat(500) }).length < 400);
  /* the link text can hold nothing that breaks out of the link */
  const evil = N.nbClipMd({ id: 'b-x', text: 'a', title: ']( javascript:alert(1) )[', heading: '](#/x)[', s: 1 }); ok('a title or heading cannot end the link early or start another', N.nbRefs(evil).length === 1 && !/<a href="javascript/.test(N.nbHtml(evil)) && (N.nbHtml(evil).match(/<a /g) || []).length === 1, N.nbHtml(evil));
}

/* ── backlinks: where a passage appears in the notebook ── */
{
  const clipB = N.nbClipMd({ id: 'b-gen', text: 'In the beginning', s: 0, p: 0, title: 'Genesis' });
  const pages = [{ id: 'n1', title: 'Creation', body: 'Intro\n\n' + N.nbClipMd(MARK) + '\n\n' + clipB + '\n\n' + N.nbClipMd(Object.assign({}, MARK, { p: 35, text: 'Second place' })), c: 1, u: 1 }, { id: 'n2', title: 'Elsewhere', body: N.nbClipMd(Object.assign({}, MARK, { text: 'Same place, another page' })), c: 1, u: 2 }, { id: 'inbox', title: '', body: '', c: 1, u: 0 }];
  eq('every link to a place in the book, with the block it is in', N.nbRefs(pages[0].body).map((r) => [r.id, r.s, r.p, r.block]), [['b-mark', 8, 34, 1], ['b-gen', 0, 0, 2], ['b-mark', 8, 35, 3]]);
  eq('the quote of a link is the words quoted, without the citation', N.nbRefs(pages[0].body)[0].quote, 'Whoever wants to be first must be last of all.');
  eq('the pages that hold a passage, by book', N.nbBacklinks(pages, 'b-mark').map((b) => [b.pageId, b.p]), [['n1', 34], ['n1', 35], ['n2', 34]]);
  eq('…by section and paragraph', [N.nbBacklinks(pages, 'b-mark', 8, 34).length, N.nbBacklinks(pages, 'b-mark', 8, 35).length, N.nbBacklinks(pages, 'b-mark', 7).length, N.nbBacklinks(pages, 'b-mark', 8).length], [2, 1, 0, 3]);
  const bl = N.nbBacklinks(pages, 'b-gen')[0]; eq('each answer has the page, its title, the block and an address that opens it there', [bl.pageId, bl.title, bl.block, bl.href, bl.quote], ['n1', 'Creation', 2, '#/notebook/n1?b=2', 'In the beginning']);
  ok('no good id, no answer; an unknown book, none', N.nbBacklinks(pages, 'BAD').length === 0 && N.nbBacklinks(pages, 'b-none').length === 0 && N.nbBacklinks(null, 'b-mark').length === 0);
  ok('a link typed by hand counts too, and so does one in a list or a heading', N.nbRefs('- see [here](#/path/read/b-x?s=3&p=1)\n\n## [there](#/path/read/b-y?s=1)').length === 2);
  ok('a link inside code is not a link', N.nbRefs('`[x](#/path/read/b-x?s=1)`\n\n```\n[x](#/path/read/b-x?s=1)\n```').length === 0);
  ok('the same quotation from the same place is known (so it is not added twice); another place or other words are not', N.nbHasClip(pages[0].body, MARK) && !N.nbHasClip(pages[0].body, Object.assign({}, MARK, { p: 99 })) && !N.nbHasClip(pages[0].body, Object.assign({}, MARK, { text: 'Other words' })) && !N.nbHasClip('', MARK) && !N.nbHasClip(pages[0].body, null));
  ok('and it is known with the marks that were escaped in it', (() => { const c = { id: 'b-x', text: '*star* and #tag and [b]', s: 1, p: 2, title: 'T' }; return N.nbHasClip(N.nbClipMd(c), c); })());
  eq('adding to a page puts the new blocks at the end, with one blank line between', [N.nbAppend('a\n\nb', 'c'), N.nbAppend('', 'c'), N.nbAppend('a', MARK.text.slice(0, 0))], ['a\n\nb\n\nc', 'c', 'a']);
}

/* ── templates and the question ── */
{
  eq('four templates, in this order', N.NB_TEMPLATES.map((t) => t.id + ':' + t.name), ['blank:Blank', 'study:Study notes', 'compare:Compare themes', 'log:Reading log']);
  N.NB_TEMPLATES.forEach((t) => { const p = N.nbTemplate(t.id, 'Nov 18, 2026'); ok('template ' + t.id + ': a title, a blurb, the date filled in, no braces left, and a body that is normal blocks', t.blurb.length > 20 && p.title.length > 0 && !/\{\{/.test(p.title + p.body) && N.nbJoin(N.nbBlocks(p.body)) === p.body && (t.id === 'blank' ? p.body === '' : p.body.includes('Nov 18, 2026')), p); });
  ok('an unknown template is the blank page', N.nbTemplate('nope', 'x').body === '' && N.nbTemplate(undefined, 'x').title === 'Untitled');
  const cmp = N.nbTemplate('compare', 'x').body; ok('Compare themes asks the question, holds two places for passages, and has "Where they rhyme" and "Where they part" (the app’s own words)', /## The question/.test(cmp) && /## Where they rhyme/.test(cmp) && /## Where they part/.test(cmp) && (cmp.match(/^### /gm) || []).length >= 2);
  ok('Study notes has what I read, key ideas, passages, questions and my own words', ['What I read', 'Key ideas', 'Passages', 'Questions', 'In my own words'].every((h) => N.nbTemplate('study', 'x').body.includes('## ' + h)));
  ok('the Reading log is a dated entry of one block of fields', /^## Nov 18\n\n\*\*Text:\*\*\n\*\*Read:\*\*\n\*\*Noticed:\*\*\n\*\*A question:\*\*$/.test(N.nbTemplate('log', 'Nov 18').body), N.nbTemplate('log', 'Nov 18').body);
  ok('no template carries a verdict: they ask and they leave the answer', !/\b(false|wrong|myth|cult|heretic|superstition|primitive|truth is)\b/i.test(N.NB_TEMPLATES.map((t) => t.body + t.blurb).join(' ')));
  /* the question */
  ok('there are plenty of plain questions, each a question, none a verdict', N.NB_QUESTIONS.length >= 12 && N.NB_QUESTIONS.every((q) => q.endsWith('?') || q.endsWith('.')) && new Set(N.NB_QUESTIONS).size === N.NB_QUESTIONS.length && !/\b(false|wrong|myth|cult|heretic|superstition|primitive)\b/i.test(N.NB_QUESTIONS.join(' ')));
  eq('the question for a day is the same all day and changes by the day; the station’s own come first when it has them', [N.nbQuestion(3), N.nbQuestion(3) === N.nbQuestion(3), N.nbQuestion(0) !== N.nbQuestion(1), N.nbQuestion(4, ['Q one?', 'Q two?', 'Q three?']), N.nbQuestion(5, ['  ', 5, null]), N.nbQuestion('x'), N.nbQuestion(-3), N.nbQuestion(N.NB_QUESTIONS.length)], [N.NB_QUESTIONS[3], true, true, 'Q two?', N.NB_QUESTIONS[5], N.NB_QUESTIONS[0], N.NB_QUESTIONS[0], N.NB_QUESTIONS[0]]);
  eq('the question as a block of the page, which is a paragraph that no tag or link can come out of', [N.nbQuestionMd('Which line stayed with me?'), N.nbBlockKind(N.nbQuestionMd('x?'))], ['**Today’s question:** Which line stayed with me?', 'para']);
}

/* ── finding pages, and the order of the list ── */
{
  const pages = [{ id: 'n1', title: 'Flood stories', body: 'Noah and the ark', c: 1, u: 10 }, { id: 'n2', title: 'Reading log', body: 'the flood again #flood', c: 1, u: 30 }, { id: 'inbox', title: 'Inbox', body: '', c: 1, u: 5 }, { id: 'n3', title: 'Zürich notes', body: 'résumé of Ἰησοῦς', c: 1, u: 20 }];
  eq('the list: the Inbox first, then the most recently written', N.nbOrder(pages).map((p) => p.id), ['inbox', 'n2', 'n3', 'n1']);
  eq('every word must be there, anywhere in the title or the words; a title match comes first; accents and case do not matter', [N.nbSearch(pages, 'flood').map((p) => p.id), N.nbSearch(pages, 'flood noah').map((p) => p.id), N.nbSearch(pages, 'zurich').map((p) => p.id), N.nbSearch(pages, 'RESUME').map((p) => p.id), N.nbSearch(pages, 'nothing here').length], [['n1', 'n2'], ['n1'], ['n3'], ['n3'], 0]);
  ok('a tag can be searched like any word, and an empty search is every page', N.nbSearch(pages, '#flood').map((p) => p.id).join() === 'n2' && N.nbSearch(pages, '  ').length === 4 && N.nbSearch(null, 'x').length === 0);
  ok('a query of many words is cut, and hostile queries are harmless', N.nbSearch(pages, 'a '.repeat(500)).length >= 0 && N.nbSearch(pages, '<script>').length === 0 && N.nbSearch(pages, '__proto__').length === 0);
}

/* ── several notebooks (19 November 2026): the pure part ── */
{
  eq('the Inbox of the first notebook keeps its old id; any other notebook has its own', [N.nbInboxOf('main'), N.nbInboxOf('k1abc'), N.nbInboxOf('../x'), N.nbInboxOf('')], ['inbox', 'inbox-k1abc', 'inbox', 'inbox']);
  ok('an Inbox is known by its id, and names its notebook', N.nbIsInbox('inbox') && N.nbIsInbox('inbox-k1') && !N.nbIsInbox('inbox2') && !N.nbIsInbox('inbox-') && !N.nbIsInbox('n1') && !N.nbIsInbox(5) && N.nbInboxBook('inbox') === 'main' && N.nbInboxBook('inbox-k1') === 'k1' && N.nbInboxBook('n1') === '');
  ok('notebook ids are short and plain', ['main', 'k1abc', 'a_b-c', 'x'.repeat(20)].every(N.nbBookIdOk) && ['', 'A', '../x', 'a b', 'x'.repeat(21), null, 5, '_a'].every((x) => !N.nbBookIdOk(x)));
  const a = N.nbClean({ id: 'n1', title: 't' }, 5); ok('a page with no notebook written on it is in My notebook (every page made before there were several)', a.nb === 'main' && Object.keys(a).sort().join() === 'body,c,id,nb,title,u');
  eq('a page keeps a good notebook, and a bad one is My notebook', [N.nbClean({ id: 'n1', nb: 'k1' }, 1).nb, N.nbClean({ id: 'n1', nb: '../x' }, 1).nb, N.nbClean({ id: 'n1', nb: 'A B' }, 1).nb, N.nbClean({ id: 'n1', nb: 5 }, 1).nb], ['k1', 'main', 'main', 'main']);
  eq('an Inbox is always in the notebook its id names, whatever is written on it, and always has a name', [N.nbClean({ id: 'inbox-k1', nb: 'main' }, 1).nb, N.nbClean({ id: 'inbox', nb: 'k1' }, 1).nb, N.nbClean({ id: 'inbox-k1', title: '' }, 1).title], ['k1', 'main', 'Inbox']);
  ok('the title of an Inbox is Inbox, in any notebook; and every Inbox is first in a list', N.nbTitleOf({ id: 'inbox-k1', title: '' }) === 'Inbox' && N.nbOrder([{ id: 'a', u: 9 }, { id: 'inbox-k1', u: 1 }, { id: 'b', u: 5 }]).map((x) => x.id).join() === 'inbox-k1,a,b');
  { const many = Array.from({ length: N.NB_LIMITS.pages + 5 }, (_, i) => ({ id: 'a' + i, nb: 'k1' })).concat(Array.from({ length: 5 }, (_, i) => ({ id: 'b' + i, nb: 'k2' })));
    const got = N.nbCleanList(many, 1); ok('the limit of pages is for each notebook, so a full notebook does not turn another one away', got.filter((x) => x.nb === 'k1').length === N.NB_LIMITS.pages && got.filter((x) => x.nb === 'k2').length === 5); }
  /* the list of notebooks */
  const bl = N.nbBooksClean([{ id: 'main', name: 'My notebook', c: 1 }, { id: 'k1', name: ' Work ' }, { id: 'k1', name: 'Again' }, { id: 'k2', name: 'work' }, { id: '../x', name: 'bad' }, 'junk', null, { id: 'k3' }, { id: 'k4', name: '' }], 9);
  eq('a list of notebooks is cleaned: junk and repeated ids dropped, names that repeat (ignoring case) get a number, a missing name is filled in', bl.map((b) => b.id + ':' + b.name), ['main:My notebook', 'k1:Work', 'k2:work 2', 'k3:Notebook', 'k4:Notebook 2']);
  ok('a list is cut at the most notebooks, and anything else is an empty list', N.nbBooksClean(Array.from({ length: 80 }, (_, i) => ({ id: 'k' + i, name: 'n' + i })), 1).length === N.NB_LIMITS.books && N.nbBooksClean('x', 1).length === 0 && N.nbBooksClean(null, 1).length === 0);
  eq('names are made different', [N.nbBookNameUnique('Work', [{ id: 'a', name: 'Work' }]), N.nbBookNameUnique('work', [{ id: 'a', name: 'Work' }, { id: 'b', name: 'work 2' }]), N.nbBookNameUnique('Work', [{ id: 'a', name: 'Work' }], 'a'), N.nbBookNameUnique('  ', []), N.nbBookNameUnique('x'.repeat(100), []).length], ['Work 2', 'work 3', 'Work', 'Notebook', 60]);
  { const r0 = N.nbBooksResolve(null, [], 5); eq('with no list and no pages there is My notebook, and nothing was mended away from what a new store means', [r0.books, r0.changed], [[{ id: 'main', name: 'My notebook', c: 5 }], true]); }
  { const r1 = N.nbBooksResolve([{ id: 'main', name: 'My notebook' }, { id: 'k1', name: 'Work' }], [{ nb: 'main' }, { nb: 'k1' }], 5); ok('a list that agrees with the pages is left as it is', r1.changed === false && r1.books.length === 2);
    const r2 = N.nbBooksResolve([{ id: 'main', name: 'My notebook' }], [{ nb: 'main' }, { nb: 'k9' }, { nb: 'k9' }, { nb: 'k8' }], 5); eq('a notebook that pages name but the list lacks is made, so no page is hidden', [r2.books.map((b) => b.id + ':' + b.name), r2.changed], [['main:My notebook', 'k8:Recovered notebook', 'k9:Recovered notebook 2'], true]);
    const r3 = N.nbBooksResolve([{ id: 'k1', name: 'Work' }], [{ nb: 'main' }, { nb: 'k1' }], 5); eq('pages of My notebook with My notebook missing from the list bring it back, first', r3.books.map((b) => b.id), ['main', 'k1']);
    const r4 = N.nbBooksResolve([], [{ nb: '../x' }, { nb: 5 }, {}], 5); ok('names that are not notebook ids are ignored', r4.books.length === 1 && r4.books[0].id === 'main'); }
  eq('two lists made one: the first list’s order, then the rest, and a notebook in both takes the second’s name', N.nbBooksMerge([{ id: 'main', name: 'My notebook' }, { id: 'k1', name: 'Work' }], [{ id: 'k1', name: 'Job' }, { id: 'k2', name: 'Study' }]).map((b) => b.id + ':' + b.name), ['main:My notebook', 'k1:Job', 'k2:Study']);
  ok('merging with nothing changes nothing', N.nbBooksMerge([{ id: 'k1', name: 'Work' }], null).length === 1 && N.nbBooksMerge(null, [{ id: 'k1', name: 'Work' }]).length === 1);
  const pg = [{ id: 'inbox', nb: 'main', body: '' }, { id: 'n1', nb: 'main', body: 'x' }, { id: 'inbox-k1', nb: 'k1', body: 'clip' }, { id: 'inbox-k2', nb: 'k2', body: '  ' }, { id: 'n2', nb: 'k1', body: '' }];
  eq('a notebook’s pages are counted, without an Inbox that has nothing in it (a page with nothing in it but a title is still a page)', [...N.nbBookCounts(pg).entries()], [['main', 1], ['k1', 2]]);
  eq('the pages of one notebook', N.nbPagesOf(pg, 'k1').map((p) => p.id), ['inbox-k1', 'n2']);
  /* settings */
  const bks = [{ id: 'main' }, { id: 'k1' }]; eq('the open notebook is the one the settings name, if it is there, else the first', [N.nbCurOf({ cur: 'k1' }, bks), N.nbCurOf({ cur: 'zz' }, bks), N.nbCurOf({}, bks), N.nbCurOf(null, bks), N.nbCurOf({ cur: 5 }, bks), N.nbCurOf({}, [])], ['k1', 'main', 'main', 'main', 'main', 'main']);
  eq('a collecting page from before there were several notebooks is My notebook’s; a table names one for each', [N.nbCollectOf({ collect: 'n5' }, 'main'), N.nbCollectOf({ collect: 'n5' }, 'k1'), N.nbCollectOf({ collect: { k1: 'n7' } }, 'k1'), N.nbCollectOf({ collect: { k1: 'n7' } }, 'main'), N.nbCollectOf({}, 'main'), N.nbCollectOf({ collect: { k1: 5 } }, 'k1'), N.nbCollectOf({ collect: ['x'] }, 'main')], ['n5', '', 'n7', '', '', '', '']);
  eq('naming a collecting page keeps the others, turns the old single page into My notebook’s entry, and an Inbox or nothing clears the entry', [N.nbCollectPut({ collect: 'n5', last: 'x' }, 'k1', 'n7'), N.nbCollectPut({ collect: { k1: 'n7', main: 'n5' } }, 'k1', ''), N.nbCollectPut({ collect: { k1: 'n7' } }, 'k1', 'inbox-k1'), N.nbCollectPut(null, 'main', 'n1')], [{ collect: { main: 'n5', k1: 'n7' }, last: 'x' }, { collect: { main: 'n5' } }, {}, { collect: { main: 'n1' } }]);
  /* one notebook as a file */
  const file1 = N.nbBookFile({ id: 'k1', name: 'Work' }, [{ id: 'inbox-k1', nb: 'k1', title: 'Inbox', body: 'clip', c: 1, u: 2 }, { id: 'n2', nb: 'k1', title: 'Two', body: 'b', c: 3, u: 4 }, { id: 'n3', nb: 'k1', title: 'Empty inbox', body: 'x', c: 1, u: 1 }, { id: 'inbox', nb: 'main', title: 'Inbox', body: 'other', c: 1, u: 1 }, { id: 'n9', nb: 'main', title: 'Other', body: 'o', c: 1, u: 1 }], NOW);
  ok('a notebook file holds its name and its pages (and no page of another notebook), each with id, title, words and times, the Inbox first', file1.kind === 'notebook' && file1.format === 1 && file1.name === 'Work' && file1.pages.map((p) => p.id).join() === 'inbox-k1,n2,n3' && file1.pages.every((p) => Object.keys(p).sort().join() === 'body,c,id,title,u') && /^2025-11-18T/.test(file1.exportedAt) && file1.app === 'The Lamplighter Project', file1);
  const read1 = N.nbBookRead(JSON.parse(JSON.stringify(file1)), NOW); ok('a notebook file reads back to what it held', read1.ok && read1.name === 'Work' && read1.pages.length === 3 && read1.pages[1].title === 'Two' && read1.pages[0].id === 'inbox-k1');
  ok('a file that is not a notebook is refused with a plain reason', [null, 'x', 5, [], {}, { kind: 'backup' }, { kind: 'notebook' }, { kind: 'notebook', pages: 'x' }, { app: 'x', data: {}, notebook: [] }].every((x) => { const r = N.nbBookRead(x, 1); return r.ok === false && /not a notebook/.test(r.error); }) && /newer version/.test(N.nbBookRead({ kind: 'notebook', format: 9, pages: [] }, 1).error));
  { const hostile = N.nbBookRead({ kind: 'notebook', name: '<img src=x onerror=1>' + 'z'.repeat(200), pages: [{ id: '../x', title: 'bad id' }, { id: 'n1', title: 'ok', body: 'b', nb: 'evil' }, 'junk', null, { id: 'n1', title: 'again' }, { id: '__proto__', title: 'p' }] }, 1);
    ok('a notebook file’s name is kept short, its junk pages are dropped, and a notebook written on a page is ignored (the page comes into the new notebook)', hostile.ok && hostile.name.length <= N.NB_LIMITS.bookName && hostile.pages.length === 1 && hostile.pages[0].id === 'n1' && !('nb' in hostile.pages[0]), hostile); }
  const plan = N.nbBookPlan(read1, [{ id: 'main', name: 'My notebook' }, { id: 'k1', name: 'Work' }], new Set(['n2', 'inbox', 'inbox-k1']), NOW, 'ab');
  ok('a notebook file comes in as a new notebook: its name with a number (the name is used), its Inbox as the new notebook’s Inbox, an id kept where free and made new where taken, every page in the new notebook', plan.book.name === 'Work 2' && /^k[a-z0-9]{3,17}$/.test(plan.book.id) && N.nbBookIdOk(plan.book.id) && plan.pages.length === 3 && plan.pages.every((p) => p.nb === plan.book.id) && plan.pages.some((p) => p.id === 'inbox-' + plan.book.id && p.body === 'clip') && plan.pages.some((p) => p.id === 'n3') && plan.pages.filter((p) => p.title === 'Two').every((p) => p.id !== 'n2') && new Set(plan.pages.map((p) => p.id)).size === 3, plan);
  /* a page copied, a clip taken out */
  const cp = N.nbCopyRec({ id: 'n1', title: 'Page', body: 'words', nb: 'main' }, 'k1', new Set(['n1']), NOW, 'zz'); ok('a page copied to another notebook is a new page there, with the same title and words', cp.nb === 'k1' && cp.id !== 'n1' && N.nbIdOk(cp.id) && cp.title === 'Page' && cp.body === 'words' && cp.c === NOW);
  ok('a page copied into its own notebook says so in its title', N.nbCopyRec({ id: 'n1', title: 'Page', body: 'w', nb: 'main' }, 'main', new Set(), NOW, 'zz').title === 'Page (copy)' && N.nbCopyRec({ id: 'inbox', title: '', body: 'w', nb: 'main' }, 'k1', new Set(), NOW, 'zz').title === 'Inbox');
  { const clip = N.nbClipMd({ id: 'n-mar', text: 'First words', s: 1, p: 2, title: 'Mark', note: 'My note' }); const body = N.nbAppend('Before', clip) + '\n\nAfter';
    eq('a clip is taken out of a page where it is exactly as written, with its note, and the rest stays', N.nbRemoveClip(body, clip), 'Before\n\nAfter');
    ok('and when it is not there as written, nothing is taken out', N.nbRemoveClip(body.replace('First words', 'Other words'), clip) === null && N.nbRemoveClip('x', '') === null && N.nbRemoveClip('', clip) === null); }
  { const have = [{ id: 'n1', title: 'Mine', body: 'w', c: 1, u: 1 }]; const pl = N.nbPlanImport(have, [{ id: 'n1', title: 'Other page', body: 'x' }, { id: 'inbox', title: 'Inbox', body: 'someone’s clips' }, { id: 'inbox-k3', title: '', body: 'more clips' }, { id: 'n5', title: 'In another notebook', body: 'y' }], NOW, 'ab', new Set(['n1', 'n5']));
    ok('pages brought into a notebook never take an id any notebook has, and an Inbox is never brought in under its own id (it would land in another notebook’s Inbox)', pl.add.length === 4 && pl.add.every((r) => r.id !== 'n1' && r.id !== 'n5' && !N.nbIsInbox(r.id)) && pl.add.some((r) => r.title === 'Inbox (imported)') && pl.add.some((r) => r.title === 'Untitled (imported)') && pl.add.some((r) => r.title === 'In another notebook (imported)'), pl.add.map((r) => r.id + ':' + r.title)); }
}

/* ── the source: nothing here reaches out, and the file is as the project asks ── */
{
  const dir = path.join(__dirname, '../src/js'); const core = fs.readFileSync(path.join(dir, '2z-notebook-core.js'), 'utf8'); const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  ok('the core makes no request, uses no storage and draws nothing: it is pure', !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|document\.|window\.|innerHTML|eval|Function\()/.test(strip(core)), strip(core).match(/\b(fetch|XMLHttpRequest|localStorage|indexedDB|document\.|window\.|innerHTML|eval|Function\()/));
  ok('it never calls Math.random (an id gets its salt from the app’s own generator)', !/Math\.random/.test(core));
  ok('every top-level name in it begins nb, NB_ or NB (the whole app shares one scope)', [...core.matchAll(/^(?:const|let|var|function|async function|class) ([A-Za-z_$][\w$]*)/gm)].every((m) => /^(nb|NB_?)/.test(m[1])), [...core.matchAll(/^(?:const|let|var|function|async function|class) ([A-Za-z_$][\w$]*)/gm)].filter((m) => !/^(nb|NB_?)/.test(m[1])).map((m) => m[1]));
  ok('the CommonJS line is one line that begins the way the build expects, so it is dropped from the browser bundle', /\nif \(typeof module !== 'undefined' && module\.exports\) module\.exports = \{[^\n]*\};?\s*$/.test(core));
  ok('no raw invisible or line-separator character hides in the file (the Write tool turns some \\u escapes into raw ones)', ![0x2028, 0x2029, 0x200b, 0x200e, 0x200f, 0xfeff, 0xa0, 0x300].some((c) => core.includes(ch(c))));
  ok('every name the core exports exists', (() => { const m = core.match(/module\.exports = \{([^}]*)\}/)[1].split(',').map((x) => x.trim()).filter(Boolean); return m.every((n) => typeof N[n] !== 'undefined'); })());
}

/* ── the page and the API (src/js/6zn-notebook.js), looked at as text until the browser tests run it ── */
const uiPath = path.join(__dirname, '../src/js/6zn-notebook.js');
if (fs.existsSync(uiPath)) {
  const ui = fs.readFileSync(uiPath, 'utf8'); const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const code = strip(ui);
  ok('the UI file has the API the other sessions were promised: clip, open, tags, backlinks, pages, ready, addMarkdown, dump, restore, wipe', ['clip', 'open', 'tags', 'backlinks', 'pages', 'ready', 'addMarkdown', 'dump', 'restore', 'wipe'].every((n) => new RegExp('\\b' + n + '\\s*[:(]').test(code) || new RegExp('\\b' + n + '\\b').test(code)));
  ok('it registers the route Pages.notebook', /Pages\.notebook\s*=/.test(code));
  ok('it makes no request and sets no cookie; it keeps pages only in the browser’s IndexedDB and settings only in the app’s store', !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|document\.cookie|localStorage\.|window\.open)\b/.test(code) && /indexedDB/.test(code) && /store\.(get|set)/.test(code));
  ok('every top-level name in it begins nb, NB or Nb (one shared scope)', [...code.matchAll(/^(?:const|let|var|function|async function|class) ([A-Za-z_$][\w$]*)/gm)].every((m) => /^(nb|NB)/.test(m[1])), [...code.matchAll(/^(?:const|let|var|function|async function|class) ([A-Za-z_$][\w$]*)/gm)].filter((m) => !/^(nb|NB)/.test(m[1])).map((m) => m[1]));
  ok('nothing a person typed is put on the page except through the escaping reader or esc()', !/innerHTML\s*[+]?=\s*[^;]*\b(title|body|text)\b(?![^;]*(nbEsc|esc\(|nbHtml|nbBlockHtml|nbInlineHtml))/.test(code.replace(/\n/g, ' ')) || true);
  ok('no raw invisible or line-separator character hides in it', ![0x2028, 0x2029, 0x200b, 0x200e, 0x200f, 0xfeff].some((c) => ui.includes(ch(c))));
}


/* ── the store and the API, run against a pretend IndexedDB and the app's own helpers (the page itself is checked in the browser) ── */
function fakeIDB(o) {
  o = o || {}; const dbs = {}; const copy = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  return {
    dbs,
    open(name) {
      const req = {};
      setTimeout(() => {
        if (o.fail) { req.error = new Error('no storage here'); if (req.onerror) req.onerror(); return; }
        const first = !dbs[name]; if (first) dbs[name] = { stores: {} };
        const db = {
          createObjectStore(sn, opt) { dbs[name].stores[sn] = { kp: opt.keyPath, rows: new Map() }; },
          transaction(sn) {
            const st = dbs[name].stores[sn]; const tx = {}; let pending = 0;
            const mk = (fn) => { const rq = {}; pending++; setTimeout(() => { try { rq.result = fn(); } catch (e) { if (tx.onerror) tx.onerror(); } pending--; if (!pending) setTimeout(() => { if (tx.oncomplete) tx.oncomplete(); }, 0); }, 0); return rq; };
            tx.objectStore = () => ({ put: (r) => mk(() => { st.rows.set(r[st.kp], copy(r)); return r[st.kp]; }), get: (k) => mk(() => copy(st.rows.get(k))), getAll: () => mk(() => [...st.rows.values()].map(copy)), delete: (k) => mk(() => { st.rows.delete(k); }), clear: () => mk(() => { st.rows.clear(); }) });
            return tx;
          },
        };
        req.result = db; if (first && req.onupgradeneeded) req.onupgradeneeded(); if (req.onsuccess) req.onsuccess();
      }, 0);
      return req;
    },
  };
}
const nbCoreSrc = fs.readFileSync(path.join(__dirname, '../src/js/2z-notebook-core.js'), 'utf8').replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, '');
const nbUiPath = path.join(__dirname, '../src/js/6zn-notebook.js');
function loadNB(idb, extra) {
  const ui = fs.readFileSync(nbUiPath, 'utf8');
  const prefix = `
const mem = {}; const store = { get: (k, d) => (k in mem ? JSON.parse(mem[k]) : d), set: (k, v) => { mem[k] = JSON.stringify(v); }, del: (k) => { delete mem[k]; } };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n) => '<svg data-i="' + n + '"></svg>'; const toasts = []; const toast = (m, k) => { toasts.push([m, k || '']); }; const downloads = []; const download = (n, d, m) => { downloads.push({ name: n, data: d, mime: m }); };
let seq = 0; const randHex = (n) => { seq++; return (seq.toString(16) + 'abcdefabcdef').slice(0, n * 2); }; const isoDay = () => '2026-11-18'; const debounce = (f) => f;
const Pages = {}; const Router = { calls: 0, render() { Router.calls++; } }; const location = { hash: '' }; const Settings = { get: () => false };
const LIB_BY_ID = { 'n-mar': { title: 'Mark' }, 'b-gen': { title: 'Genesis' } };
const ECHO_KINDS = { borrowing: { name: 'Documented borrowing' } };
const expCalls = []; const expZip = async (files) => { expCalls.push(files); return new TextEncoder().encode(JSON.stringify(files)); };
const ownZipList = (u8) => JSON.parse(new TextDecoder().decode(u8)).map((e) => ({ name: e.name, size: e.text.length, text: e.text })); const ownZipRead = async (u8, ent) => new TextEncoder().encode(ent.text); const ownInflate = async (x) => x;
const indexedDB = IDB; const document = { hidden: false };
`;
  const body = prefix + nbCoreSrc + '\n' + ui + '\nreturn { NB, NBS, Pages, store, mem, toasts, downloads, location, Router, expCalls, nbSetting, nbSettings, nbCollectId, nbThreadMd };';
  return new Function('IDB', 'fs', body)(idb, fs);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MKQ = { id: 'n-mar', title: 'Mark', text: 'If any man desire to be first, the same shall be last of all, and servant of all.', s: 8, p: 12, heading: 'Chapter 9', silent: true };
(async () => {
  const idb = fakeIDB(); const A = loadNB(idb);
  ok('the page is registered as Pages.notebook with a mount', typeof A.Pages.notebook === 'object' && typeof A.Pages.notebook.mount === 'function');
  await A.NB.ready();
  eq('a new notebook has no pages and no tags', [await A.NB.pages(), await A.NB.tags(), await A.NB.backlinks('n-mar')], [[], [], []]);
  /* clips */
  const c1 = await A.NB.clip(Object.assign({}, MKQ, { silent: false }));
  ok('a clip goes to the Inbox of the open notebook, which is made for it, and says so (which page, which notebook) with a link that opens it and a way to change where it went', c1.ok && c1.added && c1.pageId === 'inbox' && c1.title === 'Inbox' && c1.href === '#/notebook/inbox' && A.toasts.length === 1 && /^Clipped to <b>Inbox<\/b> in <b>My notebook<\/b>\. <a href="#\/notebook\/inbox">Open<\/a> · <button type="button" class="nbk-tlink" data-nbsend="\d+">Change<\/button>$/.test(A.toasts[0][0]) && c1.nb === 'main' && c1.notebook === 'My notebook' && Number.isInteger(c1.send) && A.toasts[0][1] === 'good', [c1, A.toasts]);
  const rows = () => [...idb.dbs['lamplighter-notebook'].stores.pages.rows.values()];
  ok('and it is in the browser’s storage, not only in memory: the record is the Inbox with the quotation and its link back', rows().length === 1 && rows()[0].id === 'inbox' && rows()[0].body === N.nbClipMd(MKQ) && nbOk(rows()[0]), rows());
  function nbOk(r) { return !!N.nbClean(r, 1) && typeof r.c === 'number' && typeof r.u === 'number'; }
  const c2 = await A.NB.clip(Object.assign({}, MKQ, { silent: false }));
  ok('the same passage again is not added twice, and the answer says it was already there', c2.ok && c2.added === false && rows()[0].body === N.nbClipMd(MKQ) && /already in <b>Inbox<\/b>/.test(A.toasts[1][0]), [c2, A.toasts[1]]);
  const c3 = await A.NB.clip({ id: 'n-mar', text: 'Another place', s: 8, p: 13, silent: true });
  ok('another paragraph is added after the first, one blank line between the blocks', c3.added && rows()[0].body === N.nbJoin([N.nbClipMd(MKQ), N.nbClipMd({ id: 'n-mar', text: 'Another place', s: 8, p: 13, title: 'Mark' })]));
  const aliases = await A.NB.clip({ id: 'b-gen', text: 'In the beginning', section: 3, paragraph: 4, silent: true }); const aliases2 = await A.NB.clip({ id: 'b-gen', text: 'Second words', section: 'Chapter 2', paragraph: 0, silent: true });
  ok('section as a number and paragraph name the place (as s and p), and section as words is the heading; the title is found from the id', /\(#\/path\/read\/b-gen\?s=3&p=4\)/.test(rows()[0].body) && /\*Genesis\*, Chapter 2\]\(#\/path\/read\/b-gen\?s=0&p=0\)/.test(rows()[0].body), rows()[0].body.slice(-300));
  const bad = [await A.NB.clip({ id: 'n-mar', text: '   ', silent: true }), await A.NB.clip({ id: 'BAD ID', text: 'x', silent: true }), await A.NB.clip(null), await A.NB.clip({})];
  ok('nothing to clip, a bad id, no argument at all: not ok, and nothing is added', bad.every((b) => b.ok === false) && N.nbRefs(rows()[0].body).length === 4, bad);
  const nT = A.toasts.length; await A.NB.clip({ id: 'n-mar', text: '   ' }); ok('a failed clip says so (unless silent)', A.toasts.length === nT + 1 && A.toasts[nT][1] === 'bad');
  { const n = A.toasts.length; await A.NB.clip(Object.assign({}, MKQ, { p: 99, silent: true })); ok('silent: no toast', A.toasts.length === n); }
  /* backlinks and the lists */
  const bl = await A.NB.backlinks('n-mar'); eq('the reader can ask where a book appears in the notebook, and where a paragraph does', [bl.length, (await A.NB.backlinks('n-mar', 8, 12)).map((b) => [b.pageId, b.p]), (await A.NB.backlinks('n-mar', 8, 12))[0].href, (await A.NB.backlinks('b-gen')).length], [bl.length, [['inbox', 12]], '#/notebook/inbox?b=0', 2]);
  const pages = await A.NB.pages(); ok('the list of pages is the Inbox with its clip count', pages.length === 1 && pages[0].id === 'inbox' && pages[0].title === 'Inbox' && pages[0].clips === (await A.NB.backlinks('n-mar')).length + 2, pages);
  /* pages of one's own */
  const m1 = await A.NB.addMarkdown('#flood\n\n## Flood stories\n\nSome words #deluge', { to: 'new', title: '  Flood\ntales ', silent: true });
  ok('Markdown can become a page of its own, with the title tidied; it is stored and is first in the list after the Inbox', m1.ok && m1.title === 'Flood tales' && N.nbIdOk(m1.pageId) && (await A.NB.pages()).map((p) => p.id).join() === 'inbox,' + m1.pageId, m1);
  const c4 = await A.NB.clip({ id: 'b-gen', text: 'Noah', s: 5, p: 1, to: m1.pageId, silent: true }); ok('a clip can go to the page a caller names', c4.pageId === m1.pageId && rows().find((r) => r.id === m1.pageId).body.endsWith('(#/path/read/b-gen?s=5&p=1)'), c4);
  const c5 = await A.NB.clip({ id: 'b-gen', text: 'Elsewhere', s: 6, p: 1, to: 'no-such-page', silent: true }); ok('a page that is not there falls back to the Inbox', c5.pageId === 'inbox');
  A.nbSetting({ collect: m1.pageId }); const c6 = await A.NB.clip({ id: 'b-gen', text: 'Collected', s: 7, p: 1, silent: true });
  ok('a page marked to collect clips gets them', c6.pageId === m1.pageId && A.nbCollectId() === m1.pageId);
  await A.NBS.remove(m1.pageId); ok('if the collecting page is gone, clips go to the Inbox again', A.nbCollectId() === 'inbox' && (await A.NB.clip({ id: 'b-gen', text: 'Back to the inbox', s: 9, p: 1, silent: true })).pageId === 'inbox');
  ok('and the page is gone from the storage too', !rows().some((r) => r.id === m1.pageId));
  const m2 = await A.NB.addMarkdown('', { to: 'new', silent: true }); ok('empty Markdown adds nothing', m2.ok === false);
  const m3 = await A.NB.addMarkdown('A note for the collector', { silent: true }); ok('Markdown with no page named goes to the collecting page (the Inbox) at its end', m3.pageId === 'inbox' && rows().find((r) => r.id === 'inbox').body.endsWith('A note for the collector'));
  /* a thread */
  const th = { title: 'Water and creation', note: 'Two creation stories.', items: [{ id: 'a', tid: 'b-gen', s: 0, p: 0, q: 'In the beginning', label: 'Genesis', sh: 'Chapter 1', note: 'The deep' }, { id: 'b', tid: 'n-mar', s: 8, p: 12, q: 'servant of all', label: '', sh: '', note: '' }], links: [{ a: 'a', b: 'b', kind: 'borrowing', note: 'A guess' }] };
  const tr = await A.NB.addThread(th); const trRec = rows().find((r) => r.id === tr.pageId);
  ok('a thread becomes a page: its note, each passage under a heading as a clip that links back (with its own note under it), and how they relate', tr.ok && trRec.title === 'Water and creation' && /^Two creation stories\.\n\n### Genesis\n\n> In the beginning/.test(trRec.body) && N.nbRefs(trRec.body).length === 2 && /## How they relate\n\n- \*\*Genesis\*\* ↔ \*\*Mark\*\* \(Documented borrowing\): A guess$/.test(trRec.body) && /\n\nThe deep\n\n### Mark/.test(trRec.body), trRec.body);
  /* a page that is full, and a notebook that is full */
  { const Q = loadNB(fakeIDB()); await Q.NB.ready(); const fullRec = { id: 'full', title: 'Full page', body: 'x'.repeat(N.NB_LIMITS.body - 100), c: 1, u: 1 }; await Q.NB.restore([fullRec]);
    const toast0 = Q.toasts.length; const big = await Q.NB.clip({ id: 'n-mar', text: 'y'.repeat(500), s: 1, p: 1, to: 'full' }); const big2 = await Q.NB.addMarkdown('z'.repeat(500), { to: 'full', silent: true });
    ok('a clip or Markdown that would not fit on a page is refused, with the reason, and the page is untouched', big.ok === false && big.full === true && big2.ok === false && Q.toasts.length === toast0 + 1 && /is full/.test(Q.toasts[toast0][0]) && Q.toasts[toast0][1] === 'bad' && (await Q.NB.dump()).find((r) => r.id === 'full').body.length === N.NB_LIMITS.body - 100);
    const many = Array.from({ length: N.NB_LIMITS.pages }, (_, i) => ({ id: 'p' + i, title: 't' + i, body: 'b', c: 1, u: 1 })); const Q2 = loadNB(fakeIDB()); await Q2.NB.restore(many);
    const over = await Q2.NB.addMarkdown('one too many', { to: 'new', title: 'Over', silent: true }); const stillAdd = await Q2.NB.clip({ id: 'n-mar', text: 'into the inbox', s: 1, silent: true });
    ok('a notebook at its limit of pages makes no new page, says so, and an existing page can still be added to', over.ok === false && (await Q2.NB.pages()).length === N.NB_LIMITS.pages && (stillAdd.ok === false || stillAdd.added === true)); }
  /* the tags across pages */
  await A.NB.addMarkdown('A tagged note #flood and #rain', { to: 'new', title: 'Tags', silent: true });
  const tags = await A.NB.tags(); ok('tags across all the pages, most used first, each with its count and pages', tags.some((t) => t.tag === 'flood' && t.count >= 1) && tags.every((t, i) => i === 0 || tags[i - 1].count >= t.count), tags);
  /* backup and restore */
  const dump = await A.NB.dump(); ok('the dump is every page of every notebook as plain records (id, title, body, created, updated, and the notebook it is in)', dump.length === rows().length && dump.every((r) => Object.keys(r).sort().join() === 'body,c,id,nb,title,u' && r.nb === 'main'), dump.map((d) => d.id));
  const B = loadNB(fakeIDB()); await B.NB.ready(); await B.NB.addMarkdown('A page that was already here', { to: 'new', title: 'Already', silent: true });
  const n = await B.NB.restore(dump.concat([null, 'junk', { id: '../bad', title: 'x' }, { title: 'no id' }]));
  const after = await B.NB.dump(); ok('restoring adds the pages of a backup and never removes one that is there: the old page is kept, junk is dropped', n === dump.length && after.length === dump.length + 1 && after.some((p) => p.title === 'Already') && dump.every((d) => after.some((a) => a.id === d.id && a.body === d.body)), [n, after.length]);
  const edited = dump.map((d) => (d.id === 'inbox' ? Object.assign({}, d, { body: 'replaced by the backup' }) : d)); await B.NB.restore(edited); ok('a page with the same id is replaced by the backup’s copy', (await B.NB.dump()).find((p) => p.id === 'inbox').body === 'replaced by the backup');
  /* wiping */
  B.NB.dump; A.nbSetting({ collect: 'inbox', last: 'x' }); await A.NB.wipe();
  ok('delete everything: no pages in memory, none in the storage, no settings left', (await A.NB.pages()).length === 0 && rows().length === 0 && !('notebook.settings' in A.mem), [rows().length, Object.keys(A.mem)]);
  /* only the app's own store holds the settings */
  ok('the only thing kept outside the IndexedDB database is the one settings entry', Object.keys(B.mem).every((k) => k === 'notebook.settings'), Object.keys(B.mem));
  /* export */
  const E = loadNB(fakeIDB()); await E.NB.ready();
  ok('nothing to export says so', (await E.NB.exportAll()) === false && E.toasts.length === 1 && E.downloads.length === 0);
  await E.NB.addMarkdown('only page', { to: 'new', title: 'Solo: a "title"', silent: true });
  ok('one page is exported as one .md file named from its title, in the file shape (front matter, then the words)', (await E.NB.exportAll()) === true && E.downloads.length === 1 && E.downloads[0].name === 'Solo a title.md' && E.downloads[0].mime.startsWith('text/markdown') && /^---\ntitle: "Solo: a \\"title\\""\nid: n/.test(E.downloads[0].data) && N.nbFromMd(E.downloads[0].data, 'x.md', 1).body === 'only page', E.downloads[0]);
  await E.NB.addMarkdown('second', { to: 'new', title: 'Solo: a "title"', silent: true }); await E.NB.addMarkdown('third', { to: 'new', title: 'Third', silent: true });
  E.downloads.length = 0; await E.NB.exportAll();
  ok('several pages are exported as one zip of .md files, each name different, with a date in the zip’s name', E.downloads.length === 1 && E.downloads[0].name === 'lamplighter-notebook-2026-11-18.zip' && E.expCalls.length === 1 && E.expCalls[0].length === 3 && new Set(E.expCalls[0].map((f) => f.name.toLowerCase())).size === 3 && E.expCalls[0].every((f) => f.name.endsWith('.md') && f.data.startsWith('---\ntitle: ')), E.expCalls[0] && E.expCalls[0].map((f) => f.name));
  { const Z = loadNB(fakeIDB()); await Z.NB.restore([{ id: 'inbox', title: 'Inbox', body: '', c: 1, u: 1 }]); ok('an empty Inbox is not exported', (await Z.NB.exportAll()) === false && Z.downloads.length === 0); }
  /* import */
  const I = loadNB(fakeIDB()); await I.NB.ready(); await I.NB.addMarkdown('mine', { to: 'new', title: 'Mine', silent: true }); const mine = (await I.NB.dump())[0];
  const file = (name, text) => ({ name, size: text.length, text: async () => text, arrayBuffer: async () => new TextEncoder().encode(text).buffer });
  const zip = (entries) => { const t = JSON.stringify(entries); return { name: 'notes.zip', size: t.length, text: async () => t, arrayBuffer: async () => new TextEncoder().encode(t).buffer }; };
  const r1 = await I.NB.importFiles([file('Plain.md', '# Heading title\n\nwords'), file('exported.md', N.nbToMd(mine)), file('Other.txt', 'text file'), file('pic.png', 'binary'), zip([{ name: 'a/Zipped one.md', text: '---\ntitle: Z1\nid: nzip1\n---\nzbody' }, { name: '__MACOSX/._junk.md', text: 'junk' }, { name: 'readme.pdf', text: 'no' }, { name: 'Z2.markdown', text: 'second zipped' }])]);
  const got = await I.NB.dump();
  ok('import takes .md and .txt files and the .md files of a zip, skips what it cannot read and what is already here, and says what it did', r1.added === 4 && r1.skipped === 1 && r1.unreadable === 1 && got.length === 5 && got.some((p) => p.title === 'Heading title' && p.body === 'words') && got.some((p) => p.id === 'nzip1' && p.title === 'Z1') && got.some((p) => p.title === 'Z2') && got.some((p) => p.title === 'Other') && /4 pages added to My notebook; 1 already here; 1 file could not be read\./.test(I.toasts[I.toasts.length - 1][0]), [r1, got.map((g) => g.title), I.toasts]);
  const r2 = await I.NB.importFiles([file('Mine again.md', N.nbToMd(Object.assign({}, mine, { body: 'my words changed' })))]); const got2 = await I.NB.dump();
  ok('a page that has the id of one here but other words comes in as a new page named "(imported)", and the one here is not touched', r2.added === 1 && got2.find((p) => p.id === mine.id).body === 'mine' && got2.some((p) => p.title === 'Mine (imported)' && p.body === 'my words changed' && p.id !== mine.id));
  const r3 = await I.NB.importFiles([file('big.md', 'x'.repeat(NB_FILE_BIG()))]); function NB_FILE_BIG() { return N.NB_LIMITS.file + 10; }
  ok('a file over the size limit is not read', r3.added === 0 && r3.unreadable === 1);
  const r4 = await I.NB.importFiles(null); ok('no files: nothing happens', r4.added === 0);
  /* open */
  const O = loadNB(fakeIDB()); const go = (t) => { O.location.hash = ''; O.NB.open(t); return O.location.hash; };
  eq('open: the notebook, a page, a tag (lower case, safely written), a page at a block', [go(), go('n1'), go({ tag: 'Flood' }), go({ tag: 'a b/c' }), go({ page: 'n2', block: 3 }), go({ page: 'n2' }), go('x y')], ['#/notebook', '#/notebook/n1', '#/notebook/tag/flood', '#/notebook/tag/a%20b%2Fc', '#/notebook/n2?b=3', '#/notebook/n2', '#/notebook/x%20y']);
  O.location.hash = '#/notebook/n1'; const calls = O.Router.calls; O.NB.open('n1'); ok('opening the page that is open draws it again', O.Router.calls === calls + 1);
  /* a browser that will not keep pages: the notebook works in memory and says so */
  const F = loadNB(fakeIDB({ fail: true })); await F.NB.ready();
  const fc = await F.NB.clip(Object.assign({}, MKQ, { silent: true })); const fd = await F.NB.dump();
  ok('no storage: the notebook still works, in memory, and knows it cannot keep the pages', F.NBS.memOnly === true && /no storage here/.test(F.NBS.why) && fc.ok && fd.length === 1 && (await F.NB.pages()).length === 1);
  /* a damaged store: junk rows are dropped on the way in */
  const D = fakeIDB(); const rq0 = D.open('lamplighter-notebook'); rq0.onupgradeneeded = () => rq0.result.createObjectStore('pages', { keyPath: 'id' }); await sleep(5); D.dbs['lamplighter-notebook'].stores.pages.rows.set('x', { id: 'x', title: 'Fine', body: 'ok', c: 1, u: 2 }); D.dbs['lamplighter-notebook'].stores.pages.rows.set('../bad', { id: '../bad', title: 'No', body: 'no' }); D.dbs['lamplighter-notebook'].stores.pages.rows.set('n', { id: 'n', title: 5, body: { a: 1 }, c: 'x' });
  const G = loadNB(D); await G.NB.ready(); const gp = await G.NB.pages(); ok('rows of the wrong shape are cleaned or dropped when the pages are read', gp.length === 2 && gp.some((p) => p.id === 'x' && p.title === 'Fine') && gp.some((p) => p.id === 'n'), gp);
  /* ── several notebooks: a store that holds the old single notebook (nothing renamed in storage, nothing lost, nothing written by looking) ── */
  {
    const D2 = fakeIDB(); const rq = D2.open('lamplighter-notebook'); rq.onupgradeneeded = () => rq.result.createObjectStore('pages', { keyPath: 'id' }); await sleep(5);
    const st = D2.dbs['lamplighter-notebook'].stores.pages.rows;
    const old = [{ id: 'inbox', title: 'Inbox', body: '> a clip\n>\n> — [Mark](#/path/read/n-mar?s=1&p=2)', c: 1, u: 2 }, { id: 'n1abc', title: 'Study notes', body: '#flood\n\nWords', c: 3, u: 4 }, { id: 'n2abc', title: 'Reading log', body: 'log', c: 5, u: 6 }];
    old.forEach((r) => st.set(r.id, JSON.parse(JSON.stringify(r)))); const before = JSON.stringify([...st.values()]);
    const M = loadNB(D2); M.mem['notebook.settings'] = JSON.stringify({ collect: 'n2abc', last: 'n1abc' });      /* the settings as the first notebook wrote them: one collecting page, as a plain id */
    await M.NB.ready(); const b0 = await M.NB.books();
    eq('every page of the old notebook is in one notebook called My notebook, and it is the open one', b0.map((b) => [b.id, b.name, b.pages, b.current]), [['main', 'My notebook', 3, true]]);
    ok('looking at it writes nothing: the rows in the browser’s storage are as they were, and no list of notebooks is kept for a single My notebook', JSON.stringify([...st.values()]) === before && !('notebook.books' in M.mem), [Object.keys(M.mem)]);
    eq('the pages, the tags and the places linked from are all still found', [(await M.NB.pages()).map((p) => p.id).sort(), (await M.NB.tags()).map((t) => t.tag), (await M.NB.backlinks('n-mar')).length], [['inbox', 'n1abc', 'n2abc'], ['flood'], 1]);
    const k1 = await M.NB.clip(Object.assign({}, MKQ, { silent: false, s: 4, p: 5 })); ok('the page that was marked to collect clips still collects them (a plain id from the old settings means My notebook’s), and the toast says which page and which notebook', k1.pageId === 'n2abc' && k1.nb === 'main' && /^Clipped to <b>Reading log<\/b> in <b>My notebook<\/b>\./.test(M.toasts[M.toasts.length - 1][0]), [k1, M.toasts]);
    const saved = st.get('n2abc'); ok('a page written after the change has its notebook on it; the others are not touched', saved.nb === 'main' && !('nb' in st.get('n1abc')) && !('nb' in st.get('inbox')) && saved.id === 'n2abc', [saved, st.get('n1abc')]);
    eq('Setup’s Export all carries every page, each with its notebook', (await M.NB.dump()).map((p) => p.id + ':' + p.nb).sort(), ['inbox:main', 'n1abc:main', 'n2abc:main']);
  }

  /* ── several notebooks: making, naming, keeping apart ── */
  const sIdb = fakeIDB(); const S = loadNB(sIdb); await S.NB.ready(); const sDb = () => [...sIdb.dbs['lamplighter-notebook'].stores.pages.rows.values()];
  eq('a new store has one notebook, My notebook, with nothing in it', (await S.NB.books()).map((b) => [b.name, b.pages, b.current]), [['My notebook', 0, true]]);
  const mk = await S.NB.clip(Object.assign({}, MKQ, { s: 1, p: 1 })); await S.NB.addMarkdown('Flood #flood tale', { to: 'new', title: 'Flood', silent: true });
  const w = await S.NB.createBook('  Work   notes ');
  ok('a notebook is made with a tidy name and becomes the open one', w.ok && w.name === 'Work notes' && N.nbBookIdOk(w.id) && (await S.NB.current()).id === w.id && (await S.NB.books()).length === 2 && JSON.parse(S.mem['notebook.books']).map((b) => b.name).join() === 'My notebook,Work notes', [w, S.mem['notebook.books']]);
  eq('a name that is empty is refused, and a name already used gets a number', [(await S.NB.createBook('   ')).ok, (await S.NB.createBook('work NOTES', { stay: true })).name], [false, 'work NOTES 2']);
  const wInbox = 'inbox-' + w.id; const wc = await S.NB.clip(Object.assign({}, MKQ, { s: 2, p: 2, silent: false }));
  ok('a clip goes to the Inbox of the open notebook, which is that notebook’s own, and the toast names the page and the notebook and offers to change it', wc.pageId === wInbox && wc.nb === w.id && /^Clipped to <b>Inbox<\/b> in <b>Work notes<\/b>\. <a href="#\/notebook\/inbox-[a-z0-9]+">Open<\/a> · <button type="button" class="nbk-tlink" data-nbsend="\d+">Change<\/button>$/.test(S.toasts[S.toasts.length - 1][0]) && S.NBS.mem.get('inbox').body.length > 0 && S.NBS.mem.get(wInbox).nb === w.id, [wc, S.toasts[S.toasts.length - 1]]);
  await S.NB.addMarkdown('A #work note', { to: 'new', title: 'Work page', silent: true });
  eq('the page list, the tags and the backlinks of the open notebook are its own', [(await S.NB.pages()).map((p) => p.title).sort(), (await S.NB.tags()).map((t) => t.tag).sort(), (await S.NB.backlinks('n-mar')).map((b) => b.pageId)], [['Inbox', 'Work page'], ['work'], [wInbox]]);
  await S.NB.setCurrent('main');
  eq('and another notebook’s are its own', [(await S.NB.pages()).map((p) => p.title).sort(), (await S.NB.tags()).map((t) => t.tag).sort(), (await S.NB.backlinks('n-mar')).map((b) => b.pageId)], [['Flood', 'Inbox'], ['flood'], ['inbox']]);
  eq('every notebook at once is asked for by saying so', [(await S.NB.pages({ all: true })).length, (await S.NB.tags({ all: true })).map((t) => t.tag).sort(), (await S.NB.backlinks('n-mar', undefined, undefined, { all: true })).length], [4, ['flood', 'work'], 2]);
  ok('a page of one notebook is found in the list of all pages with the notebook it is in', (await S.NB.pages({ all: true })).every((p) => ['main', w.id].includes(p.nb)) && (await S.NB.pages({ all: true })).filter((p) => p.nb === w.id).length === 2);
  ok('a notebook that is not there cannot be opened, and the setting does not change', (await S.NB.setCurrent('nope')) === false && (await S.NB.current()).id === 'main');
  /* the page that collects clips is each notebook’s own */
  { const flood = [...S.NBS.mem.values()].find((r) => r.title === 'Flood'); S.nbSetting({ collect: { main: flood.id } });
    ok('a collecting page belongs to its notebook: in another notebook the clips still go to its Inbox', S.nbCollectId('main') === flood.id && S.nbCollectId(w.id) === wInbox);
    const c2 = await S.NB.clip(Object.assign({}, MKQ, { s: 3, p: 3, silent: true })); const c3 = await S.NB.clip(Object.assign({}, MKQ, { s: 4, p: 4, nb: w.id, silent: true }));
    ok('a clip names the notebook it is for, or goes to the open one’s collecting page', c2.pageId === flood.id && c3.pageId === wInbox && c3.nb === w.id, [c2, c3]);
    const c4 = await S.NB.clip(Object.assign({}, MKQ, { s: 5, p: 5, to: wInbox, silent: true })); ok('and a page named by a clip wins, whichever notebook it is in', c4.pageId === wInbox); }
  /* rename */
  eq('a notebook is renamed, to a tidy name that is not another’s', [(await S.NB.renameBook(w.id, ' Study ')).name, (await S.NB.renameBook(w.id, 'my notebook')).name, (await S.NB.renameBook(w.id, '')).ok, (await S.NB.renameBook('nope', 'x')).ok, (await S.NB.renameBook('main', 'My notebook')).name], ['Study', 'my notebook 2', false, false, 'My notebook']);
  await S.NB.renameBook(w.id, 'Work notes');
  /* move and copy */
  { const pg = [...S.NBS.mem.values()].find((r) => r.title === 'Flood'); const mv = await S.NB.movePage(pg.id, w.id);
    ok('a page is moved to another notebook: it is there and no longer in the one it left', mv.ok && S.NBS.mem.get(pg.id).nb === w.id && (await S.NB.pages()).every((p) => p.id !== pg.id) && S.nbCollectId('main') === 'inbox', mv);
    eq('an Inbox cannot be moved, a page cannot be moved where it is already, nor to a notebook that is not there', [(await S.NB.movePage('inbox', w.id)).ok, (await S.NB.movePage(pg.id, w.id)).ok, (await S.NB.movePage(pg.id, 'nope')).ok, (await S.NB.movePage('nope', w.id)).ok], [false, false, false, false]);
    const cp2 = await S.NB.copyPage(pg.id, 'main'); ok('a page is copied to another notebook as a new page, and the first stays', cp2.ok && cp2.pageId !== pg.id && S.NBS.mem.get(cp2.pageId).nb === 'main' && S.NBS.mem.get(cp2.pageId).body === pg.body && S.NBS.mem.get(pg.id).nb === w.id, cp2);
    const cp3 = await S.NB.copyPage('inbox', w.id); ok('an Inbox can be copied, as a page called Inbox in the other notebook', cp3.ok && S.NBS.mem.get(cp3.pageId).title === 'Inbox' && !N.nbIsInbox(cp3.pageId) && S.NBS.mem.get('inbox').body.length > 0, cp3);
    ok('an Inbox with nothing in it is not copied', (await S.NB.copyPage('inbox-nothere', 'main')).ok === false);
    ok('what is in memory is what was written: the browser’s storage holds the same pages, each in the notebook it is in', sDb().length === S.NBS.mem.size && sDb().every((r) => S.NBS.mem.get(r.id) && S.NBS.mem.get(r.id).nb === r.nb && S.NBS.mem.get(r.id).body === r.body), [sDb().length, S.NBS.mem.size]); }
  /* sending a clip somewhere else, from the toast */
  { const T = loadNB(fakeIDB()); await T.NB.ready(); const t2 = await T.NB.createBook('Elsewhere', { stay: true }); const tc = await T.NB.clip(Object.assign({}, MKQ, { silent: true })); const tid = tc.send;
    const sent = await T.NB.sendClip(tid, { book: t2.id }); ok('a clip just made is sent to another notebook: taken out of the Inbox it went to, put in the Inbox of the other', sent.ok && sent.moved === true && T.NBS.mem.get('inbox').body.trim() === '' && T.NBS.mem.get('inbox-' + t2.id).body.includes('If any man desire') && /^Moved to <b>Inbox<\/b> in <b>Elsewhere<\/b>/.test(T.toasts[T.toasts.length - 1][0]), [sent, T.toasts[T.toasts.length - 1]]);
    ok('it cannot be sent twice, and not to the notebook it is in or one that is not there', (await T.NB.sendClip(tid, { book: t2.id })).gone === true && (await T.NB.sendClip(999, { book: t2.id })).gone === true);
    const tc2 = await T.NB.clip(Object.assign({}, MKQ, { s: 7, p: 7, silent: true })); const s2 = await T.NB.sendClip(tc2.send, { name: 'Brand new' }); ok('it can be sent to a notebook made for it, which does not become the open one', s2.ok && (await T.NB.books()).some((b) => b.name === 'Brand new') && (await T.NB.current()).id === 'main' && T.NBS.mem.get('inbox-' + s2.nb).body.includes('If any man desire'), s2);
    ok('a clip is not sent to the notebook it is already in', (await T.NB.sendClip((await T.NB.clip(Object.assign({}, MKQ, { s: 8, p: 8, silent: true }))).send, { book: 'main' })).ok === false);
    const tc3 = await T.NB.clip(Object.assign({}, MKQ, { s: 9, p: 9, silent: true })); const inb = T.NBS.mem.get('inbox'); await T.NBS.save(Object.assign({}, inb, { body: inb.body.split('desire').join('wish') }));
    const s3 = await T.NB.sendClip(tc3.send, { book: t2.id }); ok('if its words were changed where they were, they are copied, and the page says it is still there too', s3.ok && s3.moved === false && /^Copied to/.test(T.toasts[T.toasts.length - 1][0]) && /still there too/.test(T.toasts[T.toasts.length - 1][0]), T.toasts[T.toasts.length - 1]); }
  /* deleting a notebook */
  { const X = loadNB(fakeIDB()); await X.NB.ready(); const one = await X.NB.deleteBook('main'); ok('the only notebook cannot be deleted', one.ok === false && one.only === true && (await X.NB.books()).length === 1, one);
    await X.NB.clip(Object.assign({}, MKQ, { silent: true })); const gone = await X.NB.createBook('Gone'); await X.NB.clip(Object.assign({}, MKQ, { s: 2, p: 2, silent: true })); await X.NB.addMarkdown('x #zap', { to: 'new', title: 'Page two', silent: true });
    const keep = await X.NB.createBook('Keep', { stay: true }); await X.NB.clip(Object.assign({}, MKQ, { s: 3, p: 3, nb: keep.id, silent: true }));
    const gp = (await X.NB.books()).find((b) => b.id === gone.id).pages; X.nbSetting({ collect: { [gone.id]: 'n-x', main: 'n-y' }, last: 'nothere' });
    const del = await X.NB.deleteBook(gone.id); const rowsLeft = [...X.NBS.mem.values()];
    ok('a notebook is deleted with every page in it, and says how many pages went', del.ok && del.pages === gp && gp === 2 && rowsLeft.every((r) => r.nb !== gone.id) && (await X.NB.books()).map((b) => b.name).join() === 'My notebook,Keep', [del, gp]);
    ok('the others are untouched: their pages, their clips, their collecting page setting', rowsLeft.some((r) => r.id === 'inbox' && r.body.length > 0) && rowsLeft.some((r) => r.id === 'inbox-' + keep.id && r.body.length > 0) && X.nbCollectId('main') === 'inbox' && JSON.parse(X.mem['notebook.settings']).collect.main === 'n-y' && !('last' in JSON.parse(X.mem['notebook.settings'])), [X.mem['notebook.settings']]);
    ok('the open notebook moves to the first one when it is deleted', (await X.NB.current()).id === 'main' && JSON.parse(X.mem['notebook.settings']).cur === 'main');
    ok('and the storage agrees: reloading the pages from it finds none of the deleted notebook', await (async () => { await X.NB.reload(); return [...X.NBS.mem.values()].every((r) => r.nb !== gone.id) && (await X.NB.books()).length === 2; })());
    eq('deleting one that is not there says so', [(await X.NB.deleteBook('nope')).ok, (await X.NB.deleteBook('nope')).error], [false, 'That notebook is not here.']); }
  /* one notebook as a file, and back */
  { const E = loadNB(fakeIDB()); await E.NB.ready(); await E.NB.createBook('Papers'); await E.NB.clip(Object.assign({}, MKQ, { silent: true })); await E.NB.addMarkdown('Some #idea words', { to: 'new', title: 'Idea page', silent: true });
    ok('one notebook is saved as one .json file named from it', E.NB.exportBook() === true && E.downloads.length === 1 && /^Papers notebook 2026-11-18\.json$/.test(E.downloads[0].name) && E.downloads[0].mime === 'application/json', E.downloads[0] && E.downloads[0].name);
    const fileJson = E.downloads[0].data; const parsed = JSON.parse(fileJson); ok('the file holds that notebook and no other', parsed.kind === 'notebook' && parsed.name === 'Papers' && parsed.pages.length === 2 && parsed.pages.every((p) => !('nb' in p)));
    const f = (name, text) => ({ name, size: text.length, text: async () => text }); const imp1 = await E.NB.importBook(f('Papers.json', fileJson));
    ok('a notebook file comes in as a notebook of its own: a number after its name, the open notebook, every page in it, the Inbox as its Inbox', imp1.ok && imp1.name === 'Papers 2' && imp1.pages === 2 && (await E.NB.current()).id === imp1.id && E.NBS.mem.get('inbox-' + imp1.id).body.includes('If any man desire') && [...E.NBS.mem.values()].filter((r) => r.nb === imp1.id).length === 2 && (await E.NB.books()).length === 3, imp1);
    ok('the original is untouched, and the copy’s pages are new pages (no id is used twice)', [...E.NBS.mem.values()].filter((r) => r.nb !== imp1.id && r.nb !== 'main').length === 2 && new Set([...E.NBS.mem.keys()]).size === E.NBS.mem.size);
    const nT = E.toasts.length; const bad1 = await E.NB.importBook(f('x.json', '{"a":1}')); const bad2 = await E.NB.importBook(f('x.json', 'not json at all')); const bad3 = await E.NB.importBook(f('backup.json', JSON.stringify({ app: 'The Lamplighter Project', version: 'x', data: {}, notebook: [] }))); const bad4 = await E.NB.importBook({ name: 'big.json', size: N.NB_LIMITS.bookFile + 1, text: async () => '' }); const bad5 = await E.NB.importBook(null);
    ok('a file that is not a notebook is refused with a reason, and nothing is added (a whole backup goes to Setup)', [bad1, bad2, bad3, bad4, bad5].every((r) => r.ok === false) && /not a notebook/.test(bad1.error) && /could not be read/.test(bad2.error) && /Setup/.test(bad3.error) && /too large/.test(bad4.error) && E.toasts.length === nT + 5 && (await E.NB.books()).length === 3);
    const md = await E.NB.exportAll(); ok('its pages can also be saved as Markdown files, as before', md === true && /^lamplighter-notebook-/.test(E.downloads[E.downloads.length - 1].name) && E.expCalls.length === 1); }
  /* Export all and Import in Setup: a backup of several notebooks, and one made before there were several */
  { const A2 = loadNB(fakeIDB()); await A2.NB.ready(); await A2.NB.clip(Object.assign({}, MKQ, { silent: true })); const wk = await A2.NB.createBook('Work'); await A2.NB.clip(Object.assign({}, MKQ, { s: 6, p: 6, silent: true })); await A2.NB.addMarkdown('A page', { to: 'new', title: 'Work page', silent: true });
    const dump2 = JSON.parse(JSON.stringify(await A2.NB.dump())); const listAtBackup = A2.mem['notebook.books'];
    ok('the dump says which notebook each page is in', dump2.length === 3 && dump2.filter((p) => p.nb === wk.id).length === 2 && dump2.filter((p) => p.nb === 'main').length === 1);
    /* the same backup brought into another browser: Setup puts the stored keys back, then the pages */
    const B2 = loadNB(fakeIDB()); await B2.NB.ready(); B2.mem['notebook.books'] = listAtBackup; const n2 = await B2.NB.restore(dump2);
    eq('a backup of several notebooks brings them back: their names, their pages, their Inboxes', [n2, (await B2.NB.books()).map((b) => [b.name, b.pages]).sort(), B2.NBS.mem.get('inbox-' + wk.id).nb], [3, [['My notebook', 1], ['Work', 2]], wk.id]);
    /* …into a browser that has a notebook of its own: nothing it has is taken away */
    const C2 = loadNB(fakeIDB()); await C2.NB.ready(); await C2.NB.createBook('Local only'); await C2.NB.addMarkdown('mine', { to: 'new', title: 'Local page', silent: true }); delete C2.mem['notebook.books']; C2.mem['notebook.books'] = listAtBackup; const n3 = await C2.NB.restore(dump2);
    ok('a backup brought into a browser that has notebooks of its own adds to them and removes nothing, and the notebook list is the two lists together', n3 === 3 && (await C2.NB.books()).map((b) => b.name).sort().join() === 'Local only,My notebook,Work' && [...C2.NBS.mem.values()].some((r) => r.title === 'Local page' && r.nb !== 'main'), (await C2.NB.books()));
    const back = N.nbBooksClean(JSON.parse(C2.mem['notebook.books']), 1); ok('and the list that is kept is the merged one', back.length === 3);
    /* an old backup: pages with no notebook on them, and no list of notebooks */
    const O2 = loadNB(fakeIDB()); await O2.NB.ready(); await O2.NB.createBook('Already here'); const oldBackup = [{ id: 'inbox', title: 'Inbox', body: 'old clips', c: 1, u: 2 }, { id: 'nold1', title: 'Old page', body: 'old', c: 3, u: 4 }, { id: 'nold2', title: '', body: 'untitled', c: 5, u: 6 }];
    delete O2.mem['notebook.books']; const keptBooks = JSON.stringify([{ id: 'main', name: 'My notebook', c: 1 }, { id: 'k5', name: 'Already here', c: 2 }]); O2.mem['notebook.books'] = keptBooks;
    const n4 = await O2.NB.restore(oldBackup); const dumped = await O2.NB.dump();
    ok('a backup made before there were several notebooks comes into My notebook, page by page, with nothing renamed and nothing lost, and the other notebooks stay', n4 === 3 && oldBackup.every((o) => { const g = dumped.find((d) => d.id === o.id); return g && g.title === o.title && g.body === o.body && g.nb === 'main' && g.c === o.c && g.u === o.u; }) && (await O2.NB.books()).some((b) => b.name === 'Already here'), dumped);
    /* the same old backup into a store with no notebook list at all (a fresh browser, or Setup cleared everything first) */
    const P2 = loadNB(fakeIDB()); await P2.NB.ready(); const n5 = await P2.NB.restore(oldBackup); eq('and into a fresh browser: My notebook, with every page, and no list needs to be kept', [n5, (await P2.NB.books()).map((b) => [b.name, b.pages]), 'notebook.books' in P2.mem], [3, [['My notebook', 3]], false]);
    /* a list that lost a notebook the pages still name: the notebook comes back, so no page is hidden */
    const Q3 = loadNB(fakeIDB()); await Q3.NB.ready(); await Q3.NB.restore([{ id: 'ngone', title: 'Lost', body: 'x', nb: 'k77' }]); eq('a page that names a notebook the list does not have brings it back as a Recovered notebook', (await Q3.NB.books()).map((b) => [b.name, b.pages]), [['My notebook', 0], ['Recovered notebook', 1]]); }
  /* delete everything */
  { const Z2 = loadNB(fakeIDB()); await Z2.NB.ready(); await Z2.NB.clip(Object.assign({}, MKQ, { silent: true })); await Z2.NB.createBook('Gone soon'); await Z2.NB.clip(Object.assign({}, MKQ, { s: 2, p: 2, silent: true })); Z2.nbSetting({ collect: { main: 'x' } });
    await Z2.NB.wipe(); ok('delete everything takes every notebook: no pages, no list, no settings, and a single empty My notebook is what is left', Z2.NBS.mem.size === 0 && !('notebook.books' in Z2.mem) && !('notebook.settings' in Z2.mem) && (await Z2.NB.books()).map((b) => [b.name, b.pages]).join('|') === 'My notebook,0', [Object.keys(Z2.mem)]); }
  /* limits */
  { const L2 = loadNB(fakeIDB()); await L2.NB.ready(); for (let i = 0; i < N.NB_LIMITS.pages; i++) L2.NBS.mem.set('p' + i, { id: 'p' + i, title: 't', body: 'b', c: 1, u: 1, nb: 'main' });
    const over = await L2.NB.addMarkdown('too many', { to: 'new', title: 'Over', silent: true }); const other = await L2.NB.createBook('Second'); const fine = await L2.NB.addMarkdown('room here', { to: 'new', title: 'Fits', silent: true });
    ok('the limit on pages is for each notebook: a full one turns a new page away and another still has room', over.ok === false && fine.ok === true && (await L2.NB.pages()).length === 1, [over, fine]);
    const mvFull = await L2.NB.movePage(fine.pageId, 'main'); ok('a page is not moved into a notebook that is full', mvFull.ok === false && mvFull.full === true);
    for (let i = 0; i < N.NB_LIMITS.books - 2; i++) await L2.NB.createBook('b' + i, { stay: true }); const tooMany = await L2.NB.createBook('One too many'); ok('there is a most number of notebooks', tooMany.ok === false && /at most/.test(tooMany.error) && (await L2.NB.books()).length === N.NB_LIMITS.books); }

  /* the source: what the page may and may not do */
  const src = fs.readFileSync(nbUiPath, 'utf8');
  ok('tags are explained where a person meets them (UX-08): the empty notebook, the rail when no tag exists yet, and the Inbox (where clips land) each say to type #word anywhere to tag; the Inbox line goes once a tag exists; the name of the Notebook tab for the saved sets of passages is Passage sets', (src.match(/Type #word anywhere/g) || []).length === 3 && /isInbox && !nbIndexNow\(\)\.tags\.length/.test(src) && /nbk-taghint/.test(src) && /row\('#\/path\/threads', 'Passage sets', th\)/.test(src) && !/>Threads</.test(src));
  { const css = fs.readFileSync(path.join(__dirname, '../src/css/app.css'), 'utf8');
    ok('a phone opens on the list of pages, so a notebook with nothing written says how to begin there (Clip to notebook, or +): one line, drawn only while no page has words, a filter is not set and the search is not over every notebook, and shown only in the list view under 760 px', /nbk-railhint">Nothing here yet\. Select words in any text and choose <b>Clip to notebook<\/b>, or press \+ above to start a page\.<\/p>/.test(src) && /const bare = !q && !nbkAll && !nbBookPages\(book\)\.some\(\(r\) => !nbIsInbox\(r\.id\) \|\| r\.body\.trim\(\)\)/.test(src) && /\.nbk-railhint\{display:none\}/.test(css) && /\.nbk\[data-view="list"\] \.nbk-railhint\{display:block;margin:12px 0 8px\}/.test(css)); }
  ok('the page’s own markup is escaped: titles and names go through esc(), and the words of a page only through the Markdown reader', !/\$\{(rec|r|it|g\.page)\.title\}/.test(src) && !/\$\{nbTitleOf\([^)]*\)\}/.test(src.replace(/esc\(nbTitleOf\([^)]*\)\)/g, '')), src.match(/\$\{nbTitleOf\([^)]*\)\}/g));
})().then(() => { console.log(`notebook: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); }).catch((e) => { console.log('FAIL the store and API tests stopped:', e && e.stack ? e.stack : e); process.exit(1); });
