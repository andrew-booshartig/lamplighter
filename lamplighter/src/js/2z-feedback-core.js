/* ═══════════════════════════ 2z · feedback for the alpha (and the beta after it) ══════════════════════════
   A pre-release is shared to find out what to change, and the Lamplighter Project has no server, no accounts and no way to send anything. So a tester writes a note on the Setup page and the app
   composes a plain-text report (what the note says, which page they were on, their browser and screen); they copy it or save it as a file and send it to the person who gave them this copy, by any means they like.
   Nothing here makes a request. The report is built from what the tester left ticked, and the page shows exactly the text that will be copied. */
const FEEDBACK_STAGE = 'alpha';      /* the ONE word for the stage this release is at (the maker’s own word is “alpha”): the label by the name in the menu, the line in the first-run welcome, Setup’s line and card, the palette action and the first line of the report all say it. For the next stage change this one word to 'beta' (alpha 21 November 2026, AA-06) */
const FEEDBACK_BETA = true;      /* the pre-release switch (the name is older than the word above): a small label by the name in the menu (and a dot on the Setup gear on a phone, until Setup has been opened once), the feedback card on Setup, the palette action and the line in the first-run welcome; set it to false for a release that is no longer a pre-release, and all of them go */
const feedbackStageA = () => (/^[aeiou]/i.test(FEEDBACK_STAGE) ? 'an ' : 'a ') + FEEDBACK_STAGE;      /* “an alpha”, “a beta” */
const feedbackStageCap = () => FEEDBACK_STAGE.charAt(0).toUpperCase() + FEEDBACK_STAGE.slice(1);
const FEEDBACK_TO = '';      /* the maker's e-mail address, if they want an “Email it” button on the page; empty: the page offers Copy and Save only */
const FEEDBACK_ISSUES = 'https://github.com/andrew-booshartig/lamplighter/issues/new/choose';      /* where a person with no address to e-mail can send a note: the project's public issue page (a link that opens only when clicked, in a new tab; the app sends nothing). Empty: no such button. Used when FEEDBACK_TO is empty */
const FB_KINDS = [['broken', 'Something is broken'], ['confusing', 'Something is confusing'], ['missing', 'Something is missing'], ['wrong', 'Something is wrong (a fact, a date, a translation)'], ['like', 'Something I like'], ['other', 'Something else']];
const FB_NOTE_MAX = 4000;
/* o = { kind, note, page (a route like #/path/library, or ''), env: null | { release, version, ua, screen, window, theme, systemTheme, reducedMotion, language, origin, storage } } */
function feedbackReport(o) {
  o = o || {}; const kind = (FB_KINDS.find((k) => k[0] === o.kind) || FB_KINDS[FB_KINDS.length - 1])[1];
  const note = String(o.note || '').replace(/\r\n?/g, '\n').trim().slice(0, FB_NOTE_MAX);
  const lines = ['The Lamplighter Project ' + FEEDBACK_STAGE + ' feedback', '', 'Kind: ' + kind, '', 'What I saw, what I expected, or what I would change:', note || '(nothing written yet)'];
  const page = String(o.page || '').replace(/[\r\n]+/g, ' ').slice(0, 200); const e = o.env;
  if (page || e) lines.push('', 'Details, so the maker can find it:');
  if (page) lines.push('- Page I was on: ' + page);
  if (e) {
    const row = (label, v) => { if (v !== undefined && v !== null && String(v).trim() !== '') lines.push('- ' + label + ': ' + String(v).replace(/[\r\n]+/g, ' ').slice(0, 300)); };
    row('Release', e.release || e.version); row('Browser', e.ua); row('Screen', e.screen); row('Window', e.window);
    row('Theme', e.theme ? e.theme + (e.systemTheme ? ' (the system prefers ' + e.systemTheme + ')' : '') : ''); row('Reduced motion', e.reducedMotion === undefined ? '' : e.reducedMotion ? 'on' : 'off');
    row('Language', e.language); row('Opened from', e.origin); row('Browser storage', e.storage === undefined ? '' : e.storage ? 'available' : 'unavailable');
  }
  return lines.join('\n') + '\n';
}
const feedbackFileName = (day) => 'lamplighter-feedback-' + String(day || '').replace(/[^0-9-]/g, '').slice(0, 10) + '.txt';
/* a mailto: address for the report, or '' when the maker has not given one; mail programs cut long links, so the body is shortened (the whole report stays on the page for Copy and Save) */
function feedbackMailHref(to, report) {
  if (!to || !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(to)) return '';
  const body = report.length > 1500 ? report.slice(0, 1480) + '\n[shortened: use Copy or Save in the Lamplighter Project for the whole note]\n' : report;
  return 'mailto:' + to + '?subject=' + encodeURIComponent('The Lamplighter Project ' + FEEDBACK_STAGE + ' feedback') + '&body=' + encodeURIComponent(body);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { FEEDBACK_STAGE, FEEDBACK_BETA, feedbackStageA, feedbackStageCap, FEEDBACK_TO, FEEDBACK_ISSUES, FB_KINDS, FB_NOTE_MAX, feedbackReport, feedbackFileName, feedbackMailHref };
