/* ═══════════════════════════ 2z · Ask an AI about a passage ═══════════════════════════
   Pure functions (tests/ask.test.js). A reader who selects words, or taps a word the Word help explains, can open a small panel, pick a question and copy a ready-made prompt to the clipboard, and open an AI's
   own website in a new tab to paste it into. The Lamplighter Project sends nothing: it copies text when the reader clicks and offers a plain link that opens only when clicked (rel="noopener noreferrer").
   What is selected goes wherever the reader pastes it, under that site's own rules, and the panel says so in one line.
   The prompt is written to keep the answer to the stance of the whole project: neutral (no side taken on whether a religious claim is true), documented / reported or claimed / disputed told apart, sources
   cited and never invented, and the places where scholars disagree said out loud. Everything a person can choose is a short fixed list, and anything else is refused, as in the reading settings. */
const ASK_QUESTIONS = [
  ['mean', 'What does this mean?'],
  ['links', 'How is this connected to other traditions or texts?'],
  ['who', 'Who wrote this, and when?'],
  ['scholars', 'What do scholars disagree about here?'],
];
const ASK_AIS = [      // Gemini first (the maker's choice); the others are one choice away in the panel, kept in this browser
  ['gemini', 'Gemini', 'https://gemini.google.com/app'],
  ['chatgpt', 'ChatGPT', 'https://chatgpt.com/'],
  ['claude', 'Claude', 'https://claude.ai/new'],
  ['copilot', 'Copilot', 'https://copilot.microsoft.com/'],
];
const ASK_LIMITS = { passage: 4000, question: 600, cite: 700 };
const ASK_SENDS_NOTHING = 'The Lamplighter Project sends nothing: it copies this to your clipboard when you click, and the words you selected go wherever you paste them.';
/* the AI chosen, or Gemini when the id is not on the list */
const askAiOf = (id) => ASK_AIS.find((a) => a[0] === id) || ASK_AIS[0];
/* the question that goes in: a preset's words, or the reader's own when they wrote one, or the first preset */
function askQuestion(preset, own) {
  const o = askStr(own).replace(/\s+/g, ' ').trim().slice(0, ASK_LIMITS.question); if (o) return o;
  const p = ASK_QUESTIONS.find((q) => q[0] === preset); return (p || ASK_QUESTIONS[0])[1];
}
const askStr = (v) => (typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : '');      // text only: an object or an array is not text
const askTidy = (s, n) => askStr(s).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u2028\u2029]/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
/* the prompt, as plain text: o = { passage, cite (the citation lines: title, section, page, edition, source), focus (a word the passage was chosen for), preset, question }. A passage longer than the limit is cut and says so. Nothing is invented: a citation that
   is not known is left out. */
function askPrompt(o) {
  const x = o || {}; const raw = askStr(x.passage).trim(); const passage = askTidy(raw, ASK_LIMITS.passage); const cut = raw.length > passage.length;
  const cite = askTidy(x.cite, ASK_LIMITS.cite); const q = askQuestion(x.preset, x.question);
  const L = [];
  L.push('I am studying religious texts and want a careful, neutral answer.', '');
  L.push('THE PASSAGE');
  L.push('“' + passage + '”' + (cut ? ' (the passage is shortened here)' : ''));
  if (cite) L.push(cite);
  const focus = askTidy(x.focus, 120); if (focus) L.push('The part I am asking about: “' + focus + '”');
  L.push('', 'MY QUESTION', q, '');
  L.push('HOW TO ANSWER');
  L.push('- Be neutral. Do not take sides on whether any religious claim is true or false. Say what is documented, what is only reported or claimed, and what is disputed, and hold every tradition to the same standard.');
  L.push('- Say where scholars disagree, and give each main view fairly, with the best reasons given for it.');
  L.push('- Cite your sources (author, title, year, and the chapter or page where you can). If you are not sure of a source, say so. Do not invent references.');
  L.push('- Keep to this passage and my question. If the translation or edition matters, say how. If you need more of the text to answer well, say what you need.');
  return L.join('\n');
}
/* the words of the button that copies and opens, for the AI chosen */
const askGoLabel = (id) => `Copy the question and open ${askAiOf(id)[1]}`;
/* the web address a button opens: always https, always one of the list */
const askAiUrl = (id) => askAiOf(id)[2];
if (typeof module !== 'undefined' && module.exports) module.exports = { ASK_QUESTIONS, ASK_AIS, ASK_LIMITS, ASK_SENDS_NOTHING, askAiOf, askQuestion, askPrompt, askGoLabel, askAiUrl };
