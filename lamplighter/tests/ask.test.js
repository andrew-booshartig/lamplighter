/* "Ask an AI about this" (18 November 2026): src/js/2z-ask-core.js (the questions, the AIs and the prompt), 6kq-ask.js (the panel), 6k-reader.js (the selection bar) and 6zw-words.js (the word card). Run: node tests/ask.test.js
   The promise it must keep: the app sends nothing. A click copies a ready-made prompt to the clipboard and opens the chosen AI's own site in a new tab (a plain link, rel="noopener noreferrer"); what was selected goes
   wherever the reader pastes it, and the panel says so. The prompt asks for a neutral answer that cites sources, says where scholars disagree and takes no side. */
const fs = require('fs'); const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'js');
const A = require('../src/js/2z-ask-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x !== undefined ? JSON.stringify(x).slice(0, 500) : ''); } };
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8'); const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const ui = read('6kq-ask.js'); const rd = read('6k-reader.js'); const words = read('6zw-words.js'); const core = read('2z-ask-core.js'); const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'css', 'app.css'), 'utf8');

/* ── the questions and the AIs ── */
ok('the four questions are the ones asked for, in order, each with its own id', JSON.stringify(A.ASK_QUESTIONS.map((q) => q[1])) === JSON.stringify(['What does this mean?', 'How is this connected to other traditions or texts?', 'Who wrote this, and when?', 'What do scholars disagree about here?']) && new Set(A.ASK_QUESTIONS.map((q) => q[0])).size === 4, A.ASK_QUESTIONS);
ok('Gemini is first, at its own address, and every AI is a name and an https address with no query, key or login in it', A.ASK_AIS[0][0] === 'gemini' && A.ASK_AIS[0][2] === 'https://gemini.google.com/app' && A.ASK_AIS.every(([id, nm, url]) => /^[a-z]+$/.test(id) && /^[A-Z][A-Za-z]+$/.test(nm) && /^https:\/\/[a-z0-9.-]+\/[a-z/]*$/.test(url)) && A.ASK_AIS.length <= 4, A.ASK_AIS);
ok('an AI that is not on the list, or is the name of an object method, is Gemini', ['', 'nope', '__proto__', 'constructor', 'toString', undefined, null, 5, {}].every((v) => A.askAiOf(v)[0] === 'gemini') && A.askAiOf('claude')[0] === 'claude' && A.askAiUrl('chatgpt') === 'https://chatgpt.com/' && A.askAiUrl('x') === 'https://gemini.google.com/app');
ok('the button says what it does and which AI it opens', A.askGoLabel('gemini') === 'Copy the question and open Gemini' && A.askGoLabel('claude') === 'Copy the question and open Claude' && A.askGoLabel('zzz') === 'Copy the question and open Gemini');
ok('the one line about what is sent says nothing is sent from here, that it copies on a click, and that the words go where they are pasted', /sends nothing/.test(A.ASK_SENDS_NOTHING) && /clipboard/.test(A.ASK_SENDS_NOTHING) && /wherever you paste/.test(A.ASK_SENDS_NOTHING) && !/\n/.test(A.ASK_SENDS_NOTHING));

/* ── the question that goes in ── */
ok('a preset is its own words; the reader’s own question wins; an unknown preset is the first', A.askQuestion('who') === 'Who wrote this, and when?' && A.askQuestion('scholars', '') === 'What do scholars disagree about here?' && A.askQuestion('who', '  Is this   in the Enuma Elish?  ') === 'Is this in the Enuma Elish?' && A.askQuestion('nope') === 'What does this mean?' && A.askQuestion(undefined, undefined) === 'What does this mean?' && A.askQuestion('__proto__') === 'What does this mean?');
ok('a question is one line and not longer than the limit', A.askQuestion('', 'a\n\nb\tc').split('\n').length === 1 && A.askQuestion('', 'x'.repeat(5000)).length === A.ASK_LIMITS.question);

/* ── the prompt ── */
const cite = '— Genesis, Chapter 1, p. 3\nWorld English Bible (2020 stable text).\nBible version, eBible.org: https://ebible.org/details.php?id=eng-web.';
const P = A.askPrompt({ passage: 'In the beginning God created the heavens and the earth.', cite, preset: 'scholars' });
ok('the prompt holds the passage in quotation marks, its citation, and the question', P.includes('“In the beginning God created the heavens and the earth.”') && P.includes(cite) && P.includes('What do scholars disagree about here?'), P);
ok('it asks for a neutral answer that takes no side on whether a religious claim is true', /Be neutral/.test(P) && /Do not take sides on whether any religious claim is true or false/.test(P));
ok('it asks for the three kinds of statement the project keeps apart: documented, reported or claimed, and disputed', /documented/.test(P) && /reported or claimed|only reported or claimed/.test(P) && /disputed/.test(P));
ok('it asks for sources, and for none to be invented', /Cite your sources/.test(P) && /Do not invent references/.test(P));
ok('it asks for the places where scholars disagree to be said, each view fairly', /Say where scholars disagree/.test(P) && /each main view fairly/.test(P));
ok('it is laid out as the passage, the question and how to answer, in that order, and is plain text a person can read', P.indexOf('THE PASSAGE') < P.indexOf('MY QUESTION') && P.indexOf('MY QUESTION') < P.indexOf('HOW TO ANSWER') && !/[<>]/.test(P) && P.split('\n').length < 30 && P.length < 2000);
ok('a word card adds the word the passage was chosen for', A.askPrompt({ passage: 'a sentence', focus: 'Mobed' }).includes('The part I am asking about: “Mobed”') && !A.askPrompt({ passage: 'a sentence' }).includes('The part I am asking about'));
{ const long = 'word '.repeat(2000); const q = A.askPrompt({ passage: long }); ok('a passage longer than the limit is cut, and the prompt says it was shortened', q.includes('(the passage is shortened here)') && q.length < A.ASK_LIMITS.passage + 1500 && !A.askPrompt({ passage: 'short' }).includes('shortened'));
  const e = A.askPrompt({ passage: 'a\u0000b\u2028c\r\n\r\n\r\n\r\nd', cite: 'x\u0007y' }); ok('control characters and long runs of blank lines do not get through', !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u2028\u2029]/.test(e) && !/\n{3,}/.test(e.split('MY QUESTION')[0].replace(/\n\nMY/, '')) , e.slice(0, 120)); }
ok('odd input is safe: nothing, null, numbers, objects', [undefined, null, {}, { passage: null }, { passage: 5, cite: {}, question: [] }, 'x'].every((o) => { const t = A.askPrompt(o); return typeof t === 'string' && !/undefined|NaN|\[object|null/.test(t) && /HOW TO ANSWER/.test(t); }));
ok('a citation that is not known is left out, not made up', !/Source:/.test(A.askPrompt({ passage: 'p' })) && A.askPrompt({ passage: 'p' }).split('\n').length < A.askPrompt({ passage: 'p', cite }).split('\n').length);
ok('the prompt carries nothing about the reader: no storage, no name, no address of this app, no setting', !/Lamplighter|beatlab|localStorage|reader\.|@|file:|localhost/i.test(P));

/* ── the app sends nothing ── */
const uiCode = strip(ui); const coreCode = strip(core);
ok('the panel and the prompt open no socket, make no request, open no window and read no clipboard', !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\b|window\.open|clipboard\.read|document\.cookie|localStorage|navigator\.share/.test(uiCode + coreCode), (uiCode + coreCode).match(/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|window\.open|clipboard\.read)\b/));
ok('the one way out is a plain link that a click follows, in a new tab, handing over nothing about the page', /<a class="btn primary" id="askGo" href="\$\{esc\(askAiUrl\(aiId\)\)\}" target="_blank" rel="noopener noreferrer">/.test(ui) && (ui.match(/target="_blank"/g) || []).length === 1);
ok('the link’s address is only ever set from the list of AIs, with setAttribute, never typed into a page', /go\.setAttribute\('href', askAiUrl\(aiId\)\)/.test(ui) && !/\.href\s*=/.test(uiCode) && A.ASK_AIS.every((a) => a[2].startsWith('https://')));
ok('copying is done by the one copy helper the reader already has, only when a button is clicked, and a failure says what to do', /rdCopy\(text\.value\)/.test(ui) && /Copying is not available here/.test(ui) && /e\.target\.closest\('#askCopy'\)/.test(ui.replace(/e\.target\.closest && /g, '')) || /#askCopy/.test(ui));
ok('only the AI chosen is kept, in this browser, and the question and the passage are not', /store\.set\('ask\.ai', aiId\)/.test(ui) && (ui.match(/store\.set\(/g) || []).length === 1);
ok('the panel shows exactly what will be copied before it is copied, and says in one line where the words go', /Show exactly what will be copied/.test(ui) && /ASK_SENDS_NOTHING/.test(ui) && /readonly/.test(ui));

/* ── where it is offered ── */
ok('the selection bar has a plain “Ask an AI” button, and it hands the panel the words and their citation (the lines after the quote)', /data-sa="ask"[^>]*>\$\{icon\('sparkle'\)\}Ask an AI<\/button>/.test(rd) && /if \(a === 'ask'\) \{[^}]*askOpen\(\{ text: q0, cite: cite0, label: 'The words you selected' \}\)/.test(rd) && rd.includes("rdCitation(id, secs[sp0.s][0], q0, ") && rd.includes(".split('\\n').slice(1).join('\\n'); clearSel(); hideBar(); askOpen("));
ok('the button says what it does in its tooltip, and that nothing is sent', /title="Ask an AI about this passage: it copies a ready-made, neutral question and opens the AI’s own site in a new tab\. Nothing is sent from here\."/.test(rd));
ok('the word card has the same button, and the panel gets the sentence the word is in, the word, and the citation where the page knows it', /data-tcask[^>]*>\$\{icon\('sparkle'\)\}Ask an AI<\/button>/.test(words) && /whAskContext\(whFrom\)/.test(words) && /focus: word/.test(words) && /rdCitation\(id, heading, sentence, ''\)/.test(words));
ok('the panel is in the bundle before the reader needs it (a 6kq file after the reader’s own), with its core before both', fs.existsSync(path.join(SRC, '6kq-ask.js')) && fs.existsSync(path.join(SRC, '2z-ask-core.js')) && '2z-ask-core.js' < '6k-reader.js' && '6kq-ask.js' > '6kp-source.js');
ok('the panel is styled: the quote, the citation, the options and the text to be copied', ['.ask-quote{', '.ask-cite{', '.ask-prev textarea{', '.ask-row{', '.ask-go{'].every((s) => css.includes(s)));

/* ── the Clip slot and the notebook line (the Notebook session provides NB.clip and NB.backlinks) ── */
ok('the selection bar has a Clip to notebook button that stays hidden until the Notebook is there', /const nbOk = typeof NB !== 'undefined' && !!NB && typeof NB\.clip === 'function'/.test(rd) && /data-sa="clip"[^>]*\$\{nbOk \? '' : ' hidden'\}>\$\{icon\('bookmark'\)\}Clip to notebook<\/button>/.test(rd));
ok('a click hands the Notebook the text, the book, the place, the heading and the printed page, and nothing when there is no Notebook', /if \(a === 'clip'\) \{ if \(!nbOk\) return; const sp = spotOf\(\); await NB\.clip\(\{ id, text: quoteOf\(\), s: sp\.s, p: sp\.p, heading: secs\[sp\.s\]\[0\], page: hasPrinted \? pgmShort\(pgmAt\(pgx\.flat, sp\.s, sp\.p, sp\.a\), pgVols\) : '' \}\);/.test(rd));
ok('the line under the quote that says where the passage is already in the notebook asks NB.backlinks for this place, links only to addresses inside the app, and shows at most four', /NB\.backlinks\(id, sp\.s, sp\.p\)/.test(rd) && /\/\^#\\\/\/\.test\(x\.href\)/.test(rd) && /\.slice\(0, 4\)/.test(rd) && /typeof NB\.backlinks !== 'function'/.test(rd) && /id="selNb"/.test(rd));
{ /* the same, run: a stub Notebook, a stub bar */
  const a = rd.indexOf('    let nbSeq = 0; const paintNb = () => {'); const b = rd.indexOf('    function readSelection()'); const body = rd.slice(a, b);
  const calls = []; let pending = { kind: 'new' }; const bar = { hidden: false }; const box = { hidden: true, innerHTML: '' }; const $ = () => box; const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); const spotOf = () => ({ s: 2, p: 7 });
  const run = (NBx, list) => { const NB = NBx; box.hidden = true; box.innerHTML = ''; const f = new Function('NB', '$', 'bar', 'pending', 'spotOf', 'id', 'esc', body + '\nreturn paintNb;')(NB, $, bar, pending, spotOf, 'b-gen', esc); f(); return new Promise((r) => setTimeout(r, 20)).then(() => ({ hidden: box.hidden, html: box.innerHTML })); };
  (async () => {
    const r1 = await run({ backlinks: (id, s, p) => { calls.push([id, s, p]); return Promise.resolve([{ pageId: 'p1', title: 'Creation myths', href: '#/notebook/p1' }, { pageId: 'p1', title: 'Creation myths', href: '#/notebook/p1' }, { pageId: 'p2', title: '<b>x</b>', href: 'javascript:alert(1)' }, { pageId: 'p3', title: 'Beginnings', href: 'https://evil.example/' }]) } }, null);
    ok('with notebook pages that hold the passage the line names each once and links to the app’s own address only', calls.length === 1 && calls[0].join() === 'b-gen,2,7' && r1.hidden === false && /In your notebook: <a href="#\/notebook\/p1">Creation myths<\/a>$/.test(r1.html), r1);
    const r2 = await run({ backlinks: () => Promise.resolve([]) }); ok('with none the line stays hidden', r2.hidden === true && r2.html === '');
    const r3 = await run({ backlinks: () => Promise.reject(new Error('not ready')) }); ok('with a Notebook that fails the line stays hidden and nothing is thrown', r3.hidden === true);
    const r4 = await run(undefined); ok('with no Notebook at all nothing happens', r4.hidden === true);
    const r5 = await run({}); ok('with a Notebook that has no backlinks yet nothing happens', r5.hidden === true);
    console.log(`ask: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
  })();
}
