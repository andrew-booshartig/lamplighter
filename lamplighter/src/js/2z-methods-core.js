/* ═══════════════════════════ 2z · Methods and standards: the words and the builders of #/methods ═══════════════════════════
   BACKLOG idea 5(a), 18 November 2026. The maker: “make this a really solid researching platform and tool”, and “stay as neutral as possible. i’m not building this to direct opinions. its only a tool for
   people to form their own opinions.” One page that tells a researcher exactly how to read everything the app says, so that it can be trusted and cited. Nine parts, each a one-line answer that is always
   open and the detail behind a visible disclosure: what this is; how statements are labelled; the same rules for every tradition and group; where the texts come from; translations; privacy; the readings
   so far (a log); how to cite; what changed.
   Every claim on the page is one that the code, the tests or the working documents can show, and tests/methods.test.js holds the numbers to the data files. What grows (the log, where each part stands, the
   release notes, the three examples) is in 2z-data-methods.js. What is counted in this copy (texts, traditions, events, conflicts, the kinds of text) is read from the app’s own data when the page opens; where
   a data folder is missing the page says so and still opens. Nothing is fetched and nothing is sent, and the page has no outside link. This file is data and string builders only (the test draws it); the page
   that registers #/methods is 6zze-methods.js. The words keep to the project’s rule: the History page’s list of loaded words and the neutral-voice guard are held against them. */
const METH_PARTS = [
  { id: 'what', title: 'What this is', line: 'A free library and research tool for studying all human religion. It sets texts, dates, maps and sources side by side, and does not tell you what to believe.', more: 'What it holds, and what it is not' },
  { id: 'labels', title: 'How statements are labelled', line: 'A statement is documented, reported or disputed; a source is graded A, B or C; a date carries a confidence; and each part of the app says how far it has been read.', more: 'The labels, the grades, and how far each part has been read' },
  { id: 'same', title: 'The same rules for everyone', line: 'One frame for every tradition, a label on every statement about living people and recent conflicts, figures given with their sources, and no verdicts in the tool’s own voice.', more: 'The rules that are the same for every tradition and group' },
  { id: 'texts', title: 'Where the texts come from', line: 'Most texts are a typed copy or a machine-read scan of a printed edition, and each says which. Printed page numbers and sections are kept where they could be found.', more: 'The kinds of text, and how each was prepared' },
  { id: 'translations', title: 'Translations', line: 'The Library holds the public-domain or openly licensed translations it could find, which are often old. It has not yet compared editions work by work, and modern translations are not hosted.', more: 'What is held, what is planned, and what is not hosted' },
  { id: 'privacy', title: 'Privacy', line: 'Nothing leaves your device unless you copy or send it yourself. There are no accounts, cookies or trackers; what the app keeps is in your browser, and you can export or erase it.', more: 'What is kept, what is never sent, and how to erase it' },
  { id: 'log', title: 'Corrections log', line: '', more: 'The readings so far' },
  { id: 'cite', title: 'How to cite', line: 'A ready citation for the app, with this copy’s release stamp, in Chicago and BibTeX form; and how to cite a text, a passage and an event.', more: 'Ready-made citations, and what each address means' },
  { id: 'changes', title: 'What changed', line: '', more: 'Release notes, newest first' },
];
const METH_IDS = METH_PARTS.map((p) => p.id);
const methPart = (id) => METH_PARTS.find((p) => p.id === id) || null;
/* the lists that grow (2z-data-methods.js): read when a page is drawn, so that this file stands alone where the data is not loaded (the test sets them) */
const methData = () => ({
  log: typeof METH_LOG !== 'undefined' ? METH_LOG : [], stages: typeof METH_STAGES !== 'undefined' ? METH_STAGES : [], releases: typeof METH_RELEASES !== 'undefined' ? METH_RELEASES : [],
  examples: typeof METH_EXAMPLES !== 'undefined' ? METH_EXAMPLES : {}, who: typeof METH_WHO !== 'undefined' ? METH_WHO : '',
});

/* the words of the labels, as world_meta.json has them; the page takes them from the data when it is loaded and falls back to these (the test holds the two together) */
const METH_STATUSES = {
  documented: ['Documented', 'A record anyone can check fixes it: an inscription, a chronicle, a treaty, an excavated site, a measured date.'],
  reported: ['Reported', 'Said by someone and not fixed by a record: later accounts, oral tradition, or a reconstruction from them. Many scholars take it as probable.'],
  disputed: ['Disputed', 'Sources or scholars disagree about whether it happened, when, or why. The entry says where they differ.'],
};
const METH_GRADES = {
  A: ['A record from the time', 'An inscription, treaty, chronicle or eyewitness account.'],
  B: ['A scholarly work or database', 'Built from such records: a university-press book, a survey, a research database.'],
  C: ['A reference summary', 'An open encyclopedia article that summarises the scholarship. Good for finding the topic; check it against a scholarly source where it matters.'],
};
const METH_CONFIDENCE = { H: 'well documented', M: 'scholarly consensus', L: 'rough estimate', C: 'contested' };
/* the three stages of reading, in the words the page uses (METH_STAGES in 2z-data-methods.js says which part is at which) */
const METH_READINGS = [
  ['Unchecked', 'Written from the standard accounts, with the sources named, but the sources have not been opened again to see that they say what the page says. The page marks it “Under review”.'],
  ['First reading', 'The writer opened the pages or works the entry cites and wrote from them. Nobody else has read it yet.'],
  ['Second reading', 'A different reader opened the cited pages again, and a second source where one could be found, set the entry against them and corrected what did not hold. The changes are in the log below. It is a second pass by another reader, not a specialist’s review.'],
];

const methEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const methN = (n) => (typeof n === 'number' && isFinite(n) ? n.toLocaleString('en-US') : '');
const METH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/* '2026-11-18' → '18 November 2026'; '' for anything that is not a real date */
function methLongDate(iso) {
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(String(iso || '')); if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return '';
  return `${+m[3]} ${METH_MONTHS[+m[2] - 1]} ${m[1]}`;
}
/* a release stamp the build baked in: { date, id, stamp }; the same test as 2y-release-core.js, kept here so that this file stands alone */
const methRelOk = (rel) => !!rel && typeof rel === 'object' && /^\d{4}-\d\d-\d\d$/.test(String(rel.date || '')) && /^[0-9a-f]{6}$/.test(String(rel.id || '')) && rel.stamp === rel.date + '-' + rel.id;

/* ── what is in this copy ──
   inputs: { lib (the Library’s entries, each { id, group }), readable (the ids of the texts this copy can read, or null when it has no texts folder), traditions (a number or null), merged (the events the History
   timeline draws, or null), strands (the timeline’s strands, [{ id, label }]), conflicts (a number or null) }. A text or book a person added (the group “my”, or an id that begins u-) is not one of the project’s. */
function methCounts(inp) {
  const i = inp || {}; const lib = (i.lib || []).filter((l) => l && l.group !== 'my' && !/^u-/.test(String(l.id))); const have = new Set(lib.map((l) => l.id));
  const ids = i.readable ? i.readable.filter((id) => have.has(id)) : null;
  const merged = Array.isArray(i.merged) ? i.merged : null; const by = {}; (merged || []).forEach((e) => { by[e.strand] = (by[e.strand] || 0) + 1; });
  return { texts: lib.length, readable: ids ? ids.length : null, traditions: Number.isFinite(i.traditions) ? i.traditions : null, events: merged ? merged.length : null, conflicts: Number.isFinite(i.conflicts) ? i.conflicts : null,
    strands: merged ? (i.strands || []).map((s) => ({ id: s.id, label: s.label, n: by[s.id] || 0 })) : null };
}
/* the kinds of text among the ones this copy can read (kindOf is provKind, 2z-source-core.js). `early`: the licence line says the edition was first published before 1930 (1931 is allowed, as the line moves with the year) */
function methKinds(meta, libById, kindOf) {
  if (!meta || !libById || typeof kindOf !== 'function') return null;
  const out = { typed: 0, scan: 0, bible: 0, web: 0, total: 0, early: 0 };
  Object.keys(meta).forEach((id) => {
    const l = libById[id]; if (!l || l.group === 'my' || /^u-/.test(id)) return;
    const k = kindOf(id, meta[id]); if (k !== 'typed' && k !== 'scan' && k !== 'bible' && k !== 'web') return; out[k]++; out.total++;
    const m = /first published before (\d{4})/i.exec(String((meta[id] || {}).license || '')); if (m && +m[1] <= 1931) out.early++;
  });
  return out.total ? out : null;
}
/* how the timeline’s sources are graded: the entries (the world’s events and the conflicts), the sources they cite by grade, and how many entries rest on reference summaries alone */
function methGradeStats(events) {
  const ev = (events || []).filter((e) => e && Array.isArray(e.sources)); const g = { A: 0, B: 0, C: 0 }; let onlyC = 0;
  ev.forEach((e) => { e.sources.forEach((s) => { if (g[s.grade] !== undefined) g[s.grade]++; }); if (e.sources.length && e.sources.every((s) => s.grade === 'C')) onlyC++; });
  return { entries: ev.length, A: g.A, B: g.B, C: g.C, onlyC, better: ev.filter((e) => e.sources.some((s) => s.grade === 'A' || s.grade === 'B')).length };
}
/* the three examples of the labels, as they stand in the data: [{ status, ev }] for the ones that are there */
function methExamples(events, ids) {
  const by = {}; (events || []).forEach((e) => { if (e && e.id) by[e.id] = e; }); const ex = ids || methData().examples;
  return ['documented', 'reported', 'disputed'].map((s) => ({ status: s, ev: by[ex[s]] || null })).filter((x) => x.ev);
}

/* ── citations ── */
function methCiteApp(rel, today) {
  const ok = methRelOk(rel); const day = methLongDate(today); const year = ok ? rel.date.slice(0, 4) : /^\d{4}/.test(String(today || '')) ? String(today).slice(0, 4) : '';
  const version = ok ? 'Release ' + rel.stamp : 'A build from the source, with no release stamp'; const made = ok ? methLongDate(rel.date) : '';
  const chicago = `The Lamplighter Project. The Lamplighter Project. ${version}${made ? ', ' + made : ''}. Offline web application.${day ? ' Accessed ' + day + '.' : ''}`;
  const lines = ['@misc{' + (ok ? 'lamplighter-' + rel.stamp : 'lamplighter') + ',', '  author = {{The Lamplighter Project}},', '  title = {The Lamplighter Project},'];
  if (year) lines.push('  year = {' + year + '},');
  lines.push('  howpublished = {Offline web application. ' + version + '}' + (day ? ',' : ''));
  if (day) lines.push('  note = {Accessed ' + day + '}');
  lines.push('}');
  return { chicago, bibtex: lines.join('\n'), release: ok ? rel.stamp : '' };
}
/* an entry of the History timeline, cited as what this tool says (its own sources are better to cite for the fact) */
function methCiteEvent(rel, ev, today) {
  if (!ev || !ev.id) return '';
  const ok = methRelOk(rel); const day = methLongDate(today);
  return `The Lamplighter Project. “${ev.label}.” History timeline, entry ${ev.id} (${ev.date_label}). ${ok ? 'Release ' + rel.stamp + '. ' : ''}#/history?s=${ev.id}.${day ? ' Accessed ' + day + '.' : ''}`;
}
/* a text of the Library, cited as the edition it is and then where it was read; `by` is the edition line the Library gives */
function methCiteText(rel, id, by, today) {
  if (!id || !by) return '';
  const ok = methRelOk(rel); const day = methLongDate(today); const edition = String(by).replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  return `${edition}. Read in The Lamplighter Project${ok ? ', release ' + rel.stamp : ''}, text ${id} (#/path/read/${id}).${day ? ' Accessed ' + day + '.' : ''}`;
}

/* ── what to do about a mistake ── */
function methReportHTML(beta) {
  return beta
    ? 'Found a mistake? <a href="#/setup?fb=1">Setup, then Tell the maker what to change</a>: it writes a note that you copy or save and send yourself. The app sends nothing.'
    : 'Found a mistake? Tell whoever gave you this copy of the Lamplighter Project. This copy has no box for notes, and the app sends nothing itself.';
}

/* ── the pieces ── */
const methTag = (status, label) => `<span class="tag hx-status st-${methEsc(status)}">${methEsc(label)}</span>`;
const methLoading = (what) => `<p class="hint meth-wait" role="status">${methEsc(what)}</p>`;
/* the figures under the first line: undefined while counting, null when this copy cannot count them */
function methFigsHTML(c) {
  const x = c || {}; const fig = (n, label, sub) => `<li class="meth-fig"><b>${n === undefined ? '…' : n === null ? '—' : methN(n)}</b><span>${methEsc(label)}</span>${sub ? `<small>${methEsc(sub)}</small>` : ''}</li>`;
  const sub = x.readable === null ? 'this copy has no texts folder beside it' : typeof x.readable === 'number' ? `${methN(x.readable)} can be read in this copy; the rest are listed with where to find them` : '';
  return `<ul class="meth-figs" aria-label="What is in this copy">${fig(x.texts, 'texts in the Library', sub)}${fig(x.traditions, 'traditions in the Atlas')}${fig(x.events, 'events on the History timeline')}${fig(x.conflicts, 'conflicts and settlements')}</ul>`;
}
/* the strands of the History line with their counts, as a sentence */
function methStrandsHTML(c) {
  if (!c || !c.strands || !c.events) return '';
  const name = (s) => (s.id === 'religion' ? 'from the Atlas (beginnings, endings and adoptions by states)' : s.id === 'conflict' ? 'conflicts and settlements before 1900' : s.label.toLowerCase());
  return ` The line draws ${methN(c.events)} events: ${c.strands.filter((s) => s.n).map((s) => `${methN(s.n)} ${name(s)}`).join(', ')}.`;
}
function methKindsHTML(k) {
  if (k === undefined) return methLoading('Counting the texts…');
  if (!k) return '<p class="hint">This copy has no texts folder beside it, so it cannot count its texts by kind. The Library still lists every entry and says where to find it.</p>';
  return `<p class="meth-count"><b>In this copy,</b> of ${methN(k.total)} readable texts: ${methN(k.typed)} typed from the printed book, ${methN(k.scan)} machine-read from a scan, ${methN(k.bible)} Bible versions and ${methN(k.web)} published documents.</p>`;
}
/* a count in a sentence: … while it is being counted, “many” when this copy cannot count it */
const methCount = (v) => (v === undefined ? '…' : v === null ? 'many' : methN(v));
const methPrintedHTML = (k) => (k && typeof k.printed === 'number' && k.printed > 0 ? ` (${methN(k.printed)} texts in this copy)` : '');
const methEarlyHTML = (kd) => (kd && kd.early ? `${methN(kd.early)} of the ${methN(kd.total)} readable texts in this copy say that their edition was first published before 1930. ` : '');
/* a definition list of the labels */
function methStatusDefsHTML(statuses) {
  const st = statuses || METH_STATUSES;
  return `<dl class="meth-defs">${['documented', 'reported', 'disputed'].map((k) => { const s = st[k] || METH_STATUSES[k]; return `<dt>${methTag(k, s[0])}</dt><dd>${methEsc(s[1])}</dd>`; }).join('')}</dl>`;
}
function methExamplesHTML(world) {
  if (world === undefined) return methLoading('Finding the examples…');
  const ex = world ? methExamples(world.events) : [];
  if (!ex.length) return '<p class="hint">The examples are taken from the History timeline’s data, which is not beside this page in this copy.</p>';
  const st = (world.meta && world.meta.statuses) || METH_STATUSES; const gr = (world.meta && world.meta.grades) || METH_GRADES; const cf = (world.meta && world.meta.confidence) || METH_CONFIDENCE;
  return `<ul class="meth-eg">${ex.map(({ status, ev }) => `<li class="meth-ex"><div class="meth-ex-h">${methTag(status, (st[status] || METH_STATUSES[status])[0])} <span class="small muted">${methEsc(ev.date_label)} · date: ${methEsc(cf[ev.date_confidence] || ev.date_confidence)}</span></div>
      <p class="meth-ex-t"><a href="#/history?s=${encodeURIComponent(ev.id)}">${methEsc(ev.label)}</a></p><p class="small t2 meth-ex-s">${methEsc(ev.summary)}</p>
      <p class="small muted meth-ex-g">${(ev.sources || []).map((s) => `<span class="tag hx-grade" title="${methEsc((gr[s.grade] || [''])[0])}">${methEsc(s.grade)}</span> ${methEsc(s.title)}`).join(' · ')}</p></li>`).join('')}</ul>`;
}
function methGradesHTML(world) {
  const gr = (world && world.meta && world.meta.grades) || METH_GRADES;
  const defs = `<dl class="meth-defs">${['A', 'B', 'C'].map((k) => `<dt><span class="tag hx-grade">${k}</span></dt><dd><b>${methEsc(gr[k][0])}.</b> ${methEsc(gr[k][1])}</dd>`).join('')}</dl>`;
  if (world === undefined) return defs + methLoading('Counting the sources…');
  if (!world || !world.events) return defs;
  const g = methGradeStats(world.events);
  return defs + `<p class="meth-count"><b>In this copy,</b> ${methN(g.entries)} entries of the History timeline and Conflicts and peace cite ${methN(g.A + g.B + g.C)} sources: ${methN(g.A)} of grade A, ${methN(g.B)} of grade B and ${methN(g.C)} of grade C. ${methN(g.onlyC)} of the ${methN(g.entries)} entries cite reference summaries only; ${methN(g.better)} also cite a record from the time or a scholarly work.</p>`;
}
function methConfidenceHTML(world) {
  const cf = (world && world.meta && world.meta.confidence) || METH_CONFIDENCE;
  return `<dl class="meth-defs meth-conf">${['H', 'M', 'L', 'C'].map((k) => `<dt><span class="tag">${k}</span></dt><dd>${methEsc(cf[k])}</dd>`).join('')}</dl>`;
}
/* the claims of High-control groups have a scale of their own, because they are about living people and groups; `mov` is { grades: MOV_GRADES } from 2z-data-movements.js */
function methGroupGradesHTML(mov) {
  if (!mov || !mov.grades) return '';
  const low = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  return `<p class="meth-note"><b>High-control groups</b> grades a claim by what it rests on, never by how bad it is, on a scale of its own: ${Object.keys(mov.grades).map((k) => `<i>${methEsc(low(mov.grades[k][0]))}</i>`).join(', ')}.</p>`;
}
function methStagesHTML(stages) {
  const rows = (stages || methData().stages).map((s) => `<tr><td data-label="Part of the app"><a href="${methEsc(s.href)}">${methEsc(s.part)}</a></td><td data-label="Items" class="meth-n">${methN(s.total)}</td><td data-label="Where it stands">${methEsc(s.stands)}</td></tr>`).join('');
  return `<table class="meth-table meth-stages"><caption class="meth-sr">How far each part of the app has been read</caption><thead><tr><th scope="col">Part of the app</th><th scope="col">Items</th><th scope="col">Where it stands</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function methLogHTML(log) {
  const L = log || methData().log; const cell = (text, n, of, unit) => text || `${methN(n)}${of && of !== n ? ' of ' + methN(of) : ''} ${unit || ''}`.trim();
  const rows = L.map((r) => `<tr><td data-label="Date" class="meth-date">${r.dateNote ? methEsc(r.dateNote) + ' ' : ''}${methEsc(methLongDate(r.date))}</td><td data-label="What was read">${methEsc(r.what)}</td><td data-label="Read" class="meth-n">${methEsc(cell(r.readText, r.read, r.readOf, r.readUnit))}</td><td data-label="Changed" class="meth-n">${methEsc(cell(r.changedText, r.changed, null, r.changedUnit))}</td><td data-label="What changed">${methEsc(r.result)}</td></tr>`).join('');
  return `<table class="meth-table meth-log"><caption class="meth-sr">The readings so far, newest first</caption><thead><tr><th scope="col">Date</th><th scope="col">What was read</th><th scope="col">Read</th><th scope="col">Changed</th><th scope="col">What changed</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function methReleasesHTML(releases, relLabel) {
  const R = releases || methData().releases;
  const head = (r) => (r.stamp ? `<b>Release ${methEsc(r.stamp)}</b> <span class="muted small">· ${methEsc(methLongDate(r.date))}</span>` : '<b>This release</b> <span class="muted small">· its stamp is added at the next release</span>');
  return `${relLabel ? '<p class="meth-count">To see what changed since an older copy, find the stamp it shows (Setup, <a href="#/path/carry">Take it with you</a>, Which copy is this?) in the list: everything above it is newer.</p>' : ''}
    <ol class="meth-rel">${R.map((r) => `<li><h3 class="meth-relh">${head(r)}</h3><ul>${r.items.map((t) => `<li>${methEsc(t)}</li>`).join('')}</ul></li>`).join('')}</ol>`;
}
/* a block of text to copy: a heading, a Copy button, and the text itself */
const methCiteBlock = (id, label, text) => `<div class="meth-cite"><div class="meth-cite-h"><b>${methEsc(label)}</b><button type="button" class="btn sm" data-meth-copy="${id}">Copy</button></div><pre class="meth-pre" id="${id}" tabindex="0">${methEsc(text)}</pre></div>`;
const methCiteTextHTML = (c) => (c.textBy ? methCiteBlock('methText', 'A text, as an example (the Hermetic Museum)', methCiteText(c.rel, c.textId, c.textBy, c.today)) : '');
const methCiteEventHTML = (c) => (c.event ? methCiteBlock('methEvent', 'An entry of the History timeline, as an example', methCiteEvent(c.rel, c.event, c.today)) : '');
function methCiteHTML(c) {
  const cite = methCiteApp(c.rel, c.today);
  const addr = [
    ['#/path/read/<id>?s=<n>', 'A text of the Library, open in the reader. The id is the text’s short name in the Library. s is the section, counting from 0, so s=2 is the third section.'],
    ['#/history?s=<id>', 'One entry of the History timeline, by its id.'],
    ['#/conflicts/<id>', 'One entry of Conflicts and peace, by its id.'],
    ['#/atlas/tradition/<id>', 'The page of one tradition, by its id in the Atlas.'],
    ['#/steps?a=<id>&b=<id>', 'The chain of recorded connections between two traditions in Compare, Step by step.'],
    ['#/methods/<part>', 'One part of this page: what, labels, same, texts, translations, privacy, log, cite or changes.'],
  ];
  return `<h3>The app</h3>
    <p>Cite a release, not “the app”: the entries change from release to release, and the stamp says which one you read. ${methRelOk(c.rel) ? 'This copy’s stamp is in both forms below.' : 'This copy is a build from the source and has no stamp, so the citation says so; cite a stamped release if you can.'}</p>
    ${methCiteBlock('methChicago', 'Chicago (bibliography entry; set the title in italics)', cite.chicago)}${methCiteBlock('methBibtex', 'BibTeX', cite.bibtex)}
    <p class="small t2" style="margin:8px 0 0"><button type="button" class="btn sm" data-citeapp>Cite this app</button> in Chicago, BibTeX or RIS. A text or a passage is cited the same way, from Cite in the reader’s ⋯ row, on the Random card or on a text’s source card.</p>
    <h3>A text, or a passage in it</h3>
    <p>Cite the printed edition first, as scholars do, and then where you read it. A text’s “Where this text comes from” card names the edition, its translator and year, and where the same edition can be found. Select words in the reader and use Copy: the copy carries the words, the title, the section, the printed page where the text has them, the edition and where it is from. A reference is never invented: a verse number is shown only where the text has one, a page only where the printed page was found, and otherwise the section.</p>
    <div data-meth-slot="cite-text">${methCiteTextHTML(c)}</div>
    <h3>An event, a conflict or a tradition</h3>
    <p>Cite the entry’s own sources for a fact, and the entry itself only for what this tool says about them. The entry’s sources and their grades are listed in its panel.</p>
    <div data-meth-slot="cite-event">${methCiteEventHTML(c)}</div>
    <h3>What each address means</h3>
    <p>The part of an address after the # is the page and its choices, and is the same in every copy of a release. The part before it is where your copy lives (a file on a computer, or a website) and is different for every copy: give the part from the # on, with the release stamp.</p>
    <table class="meth-table meth-addr"><caption class="meth-sr">What each address means</caption><thead><tr><th scope="col">Address</th><th scope="col">What it opens</th></tr></thead><tbody>${addr.map(([a, t]) => `<tr><td data-label="Address"><code>${methEsc(a)}</code></td><td data-label="What it opens">${methEsc(t)}</td></tr>`).join('')}</tbody></table>`;
}

/* ── the nine parts ── */
function methBody(id, c) {
  const k = c.counts || {}; const n = methCount; const world = c.world; const d = methData();
  switch (id) {
    case 'what':
      return `<h3>What it holds</h3><ul class="meth-list">
        <li>The <a href="#/path/library"><b>Library</b></a> holds texts in English translation that are in the public domain or openly licensed. A work that is in copyright is not held: an entry that cannot be read here names a standard translation to look for. The rule is that copyright is the only reason to leave a text out: the aim is all human religion, and nothing is left out for being unverified or not canon; it is kept, labelled and explained.</li>
        <li>The <a href="#/atlas/traditions"><b>Atlas</b></a> holds <span data-meth-slot="n-traditions">${n(k.traditions)}</span> traditions, each with where and when it began, how sure that date is, and its links to others.</li>
        <li>The <a href="#/history"><b>History timeline</b></a> sets events of the world beside the religious ones, from 3500 BCE to 1900 CE.<span data-meth-slot="strands">${methStrandsHTML(k)}</span> It is a selection made by the author, not a ranking of what mattered most, and regions and periods are not yet evenly covered.</li>
        <li><a href="#/conflicts"><b>Conflicts and peace</b></a> records <span data-meth-slot="n-conflicts">${n(k.conflicts)}</span> wars, quarrels between religious communities and settlements in which religion was among the causes that anyone involved gave or that a historian names. It is not a count of which religion has caused most wars, and many conflicts are not written up yet.</li></ul>
        <h3>What it is not</h3><ul class="meth-list">
        <li><b>Not a ranking.</b> No tradition is placed above another, and differences are kept in view beside likenesses.</li>
        <li><b>Not a verdict.</b> It does not say which claim of any tradition is true. Where a tradition says something about itself, the page says that it says so.</li>
        <li><b>Not advice.</b> It does not tell anyone what to believe or what to do, and it has no recommendation engine. The sound and light features are not a medical device or a treatment.</li>
        <li><b>No horoscopes and no predictions.</b> The page on <a href="#/sky/astrology">astrology</a> sets out what six systems say, how each is worked out and what has been tested. It makes no reading of anyone’s birth.</li></ul>
        <p class="hint">The aim is a tool for people to form their own opinions, not to direct them. The figures are counted from this copy when the page opens.</p>`;
    case 'labels':
      return `<h3>Three labels for a statement</h3>
        <p>On the History timeline, in Conflicts and peace, in the causes of Step by step and in Astrology’s systems, a statement carries one of these. Conflicts and Astrology call the second one “Reported or claimed”.</p>
        ${methStatusDefsHTML(world && world.meta && world.meta.statuses)}
        <p>One real entry of the History timeline for each, as it stands in the data:</p><div data-meth-slot="examples">${methExamplesHTML(world)}</div>
        <h3>Grades for sources</h3><p>A grade says what kind of source it is, and the kind decides it. It is not a score for the claim: a record from the time can be one-sided, and a reference summary can be right.</p>
        <div data-meth-slot="grades">${methGradesHTML(world)}</div>${methGroupGradesHTML(c.mov)}
        <h3>How sure a date is</h3><p>Every date has a confidence. The Atlas uses the same four letters for its traditions, texts and sites.</p>${methConfidenceHTML(world)}
        <h3>How far each part has been read</h3>
        <dl class="meth-defs meth-read">${METH_READINGS.map((r) => `<dt><b>${methEsc(r[0])}</b></dt><dd>${methEsc(r[1])}</dd>`).join('')}</dl>
        ${methStagesHTML(c.stages)}
        <p class="meth-note">${methEsc(c.who || d.who)}</p>`;
    case 'same':
      return `<ul class="meth-list">
        <li><b>One frame for every tradition.</b> What a tradition holds is written as what it holds (“held to have been revealed”, “said to”, “in its own account”), never as the tool’s own statement that it is so. This applies to every tradition, the largest included. A title is not a status: the page uses a person’s name, with “known as” where the title matters. Dates, places, who built what and what a text says are stated plainly, because they can be checked.</li>
        <li><b>The same page for every tradition.</b> A tradition’s page is made from the same fields whatever its size: where and when it began and how sure that is, what it grew from and what grew from it, its texts, its map and how it is practised.</li>
        <li><b>Living people, current groups and recent conflicts are labelled statement by statement</b>: documented, reported or claimed, or disputed. On <a href="#/traditions/movements">High-control groups</a>, a claim about a living person rests on a court record, an official report or at least two independent reputable sources; otherwise the card says that it is alleged, and by whom. In <a href="#/conflicts">Conflicts and peace</a>, anything that runs past 1945 is marked “Within living memory”.</li>
        <li><b>Figures come with their sources.</b> The dead of a conflict are given as a range, with what is counted and who gives each end; where no source gives a figure the entry says “Not recorded”. A group’s size is given as a claim with its grade and source: what the group says, beside what independent sources estimate where both are known.</li>
        <li><b>The group’s own account sits beside the others’.</b> A group’s card gives what the movement says about itself and its reply, beside what courts, officials, researchers and former members report. An entry on a conflict gives what each side said the matter was, in its own words where a source records them, and says whose a source is when it belongs to one side. <a href="#/sky/astrology">Astrology’s systems</a> are set out as their practitioners state them, with what has been tested and what practitioners and critics each say of it.</li>
        <li><b>No verdicts and no loaded words in the tool’s own voice.</b> A test that ships with the project scans every summary, note and page text for words of accusation or praise and for beliefs written as fact, and fails on them. A word may stand only where the sentence says whose claim it is, or inside a quotation or a source’s title.</li></ul>
        <p class="hint">Neutral does not mean that every claim is treated as equally well supported. Where a record fixes something, the entry says documented; where it does not, it says that too.</p>`;
    case 'texts':
      return `<p>Every text in the <a href="#/path/library">Library</a> says what it is made from, on a strip at its top and on its “Where this text comes from” card.</p>
        <div data-meth-slot="kinds">${methKindsHTML(c.kinds)}</div>
        <ul class="meth-list">
        <li><b>Typed from the printed book.</b> A typed or proofread copy of a printed edition. The words are checked, though spelling and punctuation may be tidied.</li>
        <li><b>Machine-read from a scan of the printed book.</b> A program read a scan of the old book. Some words are wrong, and a page that the scan lacks is lacking. The scan itself has every page, and the card links to it.</li>
        <li><b>Bible versions</b> have chapters and verses. <b>Published documents</b> come from a site of their own, such as a university press, an archive or the United Nations.</li></ul>
        <h3>Printed page numbers and sections are kept</h3>
        <p>A scholar cites the page of an edition. Where the page numbers of the printed edition could be found, from the scan’s own page data or from a web edition that follows the printed book<span data-meth-slot="printed">${methPrintedHTML(k)}</span>, the reader marks where each printed page begins, as <i>p. 214</i>, and the sections follow the book. A number that was not read from the page but proved by the pages on either side is marked with a ~.</p>
        <p><b>Find a page in the original scan.</b> On a machine-read text’s card, type a few words from the page you are reading and the finder opens the Internet Archive’s own scan of the book at those words, so that you can see the page as printed. It needs a connection and opens only when you click; the Lamplighter Project itself sends nothing.</p>
        <h3>What “machine-read from a scan: some words may be wrong” means</h3>
        <p>A scan is a photograph of each page, and a program reads the letters from it. Where it misreads, a word is wrong. In one book, a passage drawn at random showed “ove thing” for “one thing” and “z¢s earth” for “its earth”: those were the program’s misreadings, not the translator’s English. The Library’s copy of that book, The Hermetic Museum (1893), was then replaced by a typed copy of the same edition, and the share of its words with stray marks fell from 0.254% to 0.037% (see the log, part 7). A passage drawn at random from a machine-read text says so.</p>
        <h3>A text that is not in the Library</h3>
        <p>A work in copyright, or one with no open English translation, appears in the Library as an entry that names a standard translation to look for. The Atlas also catalogues texts from every tradition, whether or not they can be read here. <a href="#/path/own">Your own texts</a> can be added to the reader, and stay in your browser.</p>
        <h3>Planned: a quality pass</h3>
        <p>When the collection is complete, a quality pass is planned: every text will be given a measured score for how clean its words are, the worst will be looked at again for a cleaner copy of the same edition, and samples will be proofread against the page scans, with the corrections kept in an open list beside the texts. It is a plan and not a result: so far one book, the Hermetic Museum, has been done, as a trial.</p>`;
    case 'translations':
      return `<ul class="meth-list">
        <li><b>What the Library holds.</b> The public-domain or openly licensed translations it could find, which for many works is one translation, and often an old one. <span data-meth-slot="early">${methEarlyHTML(c.kinds)}</span>An old translation has the vocabulary and the scholarship of its time.</li>
        <li><b>It has not yet compared editions.</b> The Library does not claim that the translation it holds is the best that exists. Comparing the editions of each work is part of the planned quality pass (part 4).</li>
        <li><b>“Which translation?” cards are planned.</b> A card for each work will say what versions exist, how they differ, what is said about each (graded documented, reported or disputed), and which one the Library holds and why. One has been written as a trial, for the Hermetic Museum; it is not in the reader yet.</li>
        <li><b>Modern translations are not hosted.</b> A translation made recently is in copyright. Where the best translation of a work is a modern one, its card will name it (author, publisher, year) and say why the Library’s is older.</li>
        <li><b>Bibles side by side</b> (Library, More) sets several English versions of a Bible passage next to each other.</li></ul>`;
    case 'privacy':
      return `<ul class="meth-list">
        <li><b>Nothing leaves your device unless you copy or send it yourself.</b> There is no account to make and no sign-in. The app sets no cookies and has no tracker, advertising or analytics. It makes no network request of its own except to load its own files (the atlas, texts and other folders) from where it was opened. Where that is a website, the website’s host sees each request for the page and its files (which file, when, from what network address), as any website does; the app adds nothing to it. A test that ships with the project (the privacy test) reads the whole app on every build and fails on a network call, a tracker, a cookie, or a font or script from another site. <a href="#/path/freedom">Our promises</a> says the same in its own words.</li>
        <li><b>Links to other sites open only when you click them,</b> in a new tab, and the other site is not told which page sent you. It does see your visit, as any website does.</li>
        <li><b>Ask an AI copies a prompt to your clipboard when you click,</b> and offers a link to the AI’s own site that opens only when you click it. It shows exactly what will be copied, and the app sends nothing. What you paste into that site goes to it, under its own rules.</li>
        <li><b>What is kept, and only in this browser:</b> your settings; your reading place, highlights, bookmarks and notes; passage sets; your progress and notes in the Journey and your journal; your notebooks (you can keep as many as you like, each with its own pages); and the texts and PDFs you add. If you save the website copy for offline use, the browser also keeps copies of the app’s own files.</li>
        <li><b>Export.</b> <a href="#/setup/data">Setup → Your data</a> has Export all, which writes one file with your settings, marks, notes, passage sets, every page of every notebook and the texts you added, and Import restores it. PDFs you added are not in that file, because they can be large: each can be saved on its own row of Your data (Save a copy), and a single notebook can be saved on its own from the Notebook’s menu.</li>
        <li><b>Erase.</b> <a href="#/setup/data">Setup → Your data</a> lists each kind of data with what it holds and a button of its own; each asks first, says what goes and whether it can be undone, and the small ones can be put back for about eight seconds. Delete everything, the last line of that page, lists every kind with its count and removes all of it from this browser, the PDFs you added and the offline copies of the Library included. Nothing there deletes a file on your computer’s disk. Clearing the browser’s site data erases everything too.</li>
        ${c.beta ? '<li><b>The note for the maker.</b> The report that Setup writes (“Tell the maker what to change”) is built on your device and shown to you in full. You copy it or save it and send it yourself; nothing is sent from the app.</li>' : ''}</ul>`;
    case 'log':
      return `${methLogHTML(c.log)}<p class="hint">Read is how many items were set against their sources or the Library’s texts (the wording row counts what a test scanned). Changed is how many had their words, numbers or sources altered. A reading by the one who wrote an entry is not in this table: it is the first reading.</p><p class="meth-note">${methReportHTML(!!c.beta)}</p>`;
    case 'cite':
      return methCiteHTML(c);
    case 'changes':
      return methReleasesHTML(c.releases, c.relLabel);
    default:
      return '';
  }
}
/* the line of a part: most are fixed; the log and the release notes say what they hold */
function methLine(id, c) {
  const p = methPart(id); if (!p) return '';
  if (id === 'log') { const L = c.log || methData().log; const first = L[0]; return `${L.length} readings so far, newest first: what was checked, how many items were read, how many changed, and when.${first ? ` The most recent was on ${methLongDate(first.date)}.` : ''}`; }
  if (id === 'changes') return `What changed in each release, newest first, in plain words.${c.relLabel ? ' This copy: ' + c.relLabel + '.' : ''}`;
  return p.line;
}
/* the whole body of the page: head, nine parts, each a line and a disclosure; `slots` are the places the live figures go */
function methPartsHTML(c) {
  const open = c.open || '';
  return METH_PARTS.map((p, i) => `<section class="meth-part" id="meth-${p.id}" aria-labelledby="meth-h-${p.id}"><h2 id="meth-h-${p.id}" tabindex="-1"><span class="meth-no" aria-hidden="true">${i + 1}</span>${methEsc(p.title)}</h2>
    <p class="meth-line">${methEsc(methLine(p.id, c))}</p>${p.id === 'what' ? `<div data-meth-slot="figs">${methFigsHTML(c.counts)}</div>` : ''}
    <details class="meth-more" data-part="${p.id}"${open === p.id ? ' open' : ''}><summary>${methEsc(p.more)}</summary><div class="meth-body">${methBody(p.id, c)}</div></details></section>`).join('');
}
function methTocHTML() { return `<nav class="meth-toc" aria-label="The parts of this page"><ol>${METH_PARTS.map((p) => `<li><a href="#/methods/${p.id}" data-meth-go="${p.id}">${methEsc(p.title)}</a></li>`).join('')}</ol></nav>`; }
function methPageHTML(c) {
  return `<div class="meth-top"><p class="meth-lede">Each part has a one-line answer. The detail is one click under it.</p><button type="button" class="btn sm ghost" data-meth-all="open">Open every part</button></div>${methTocHTML()}${methPartsHTML(c || {})}`;
}
/* what goes into a slot when its data arrives (the page replaces the slot’s contents; the disclosures around it keep their state) */
function methSlotHTML(name, c) {
  switch (name) {
    case 'figs': return methFigsHTML(c.counts);
    case 'kinds': return methKindsHTML(c.kinds);
    case 'examples': return methExamplesHTML(c.world);
    case 'grades': return methGradesHTML(c.world);
    case 'n-traditions': return methCount((c.counts || {}).traditions);
    case 'n-conflicts': return methCount((c.counts || {}).conflicts);
    case 'strands': return methStrandsHTML(c.counts);
    case 'printed': return methPrintedHTML(c.counts);
    case 'early': return methEarlyHTML(c.kinds);
    case 'cite-text': return methCiteTextHTML(c);
    case 'cite-event': return methCiteEventHTML(c);
    default: return '';
  }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { METH_PARTS, METH_IDS, METH_STATUSES, METH_GRADES, METH_CONFIDENCE, METH_READINGS, methData, methEsc, methN, methLongDate, methRelOk, methCounts, methKinds, methGradeStats, methExamples, methCiteApp, methCiteEvent, methCiteText, methReportHTML, methFigsHTML, methStrandsHTML, methKindsHTML, methCount, methPrintedHTML, methEarlyHTML, methStatusDefsHTML, methExamplesHTML, methGradesHTML, methConfidenceHTML, methGroupGradesHTML, methStagesHTML, methLogHTML, methReleasesHTML, methCiteHTML, methBody, methLine, methPartsHTML, methTocHTML, methPageHTML, methSlotHTML };
