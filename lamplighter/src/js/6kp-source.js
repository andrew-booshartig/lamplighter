/* ═══════════════════════════ 6kp · Where this text comes from, shown in the reader ═══════════════════════════
   The rules and the links are in 2z-source-core.js; this draws them: the strip at the top of a scanned text (it is machine-read, and where the original pages are), the card in the reader's details
   (the edition, the source, the rights, a finder that opens the Internet Archive's own scan at the words you give it, and the original files from 2z-originals-core.js), and the way a selected passage is
   sent to its page in the scan. A link is only followed when it is clicked; nothing is sent from here. */
function provStripHTML(info, printed) {
  if (!info || info.kind !== 'scan') return '';
  /* L-08 of FINAL_AUDIT.md: on a phone the strip is one quiet line (the badge, a few words, More) and the whole note and the link to the original pages are one tap away; a laptop shows it all, as before. The short words are only drawn where the long ones are hidden (app.css, .rd-src-s). */
  return `<div class="rd-source" role="note"><span class="rd-src-t"><b>${esc(provBadge(info))}</b> <span class="rd-src-s">some words are wrong</span><span class="rd-src-n">${esc(provNotice(info, printed))}</span></span><button type="button" class="btn sm ghost rd-src-b" data-rdsheet="source">See the original pages</button><button type="button" class="rd-src-m" aria-expanded="false">More</button></div>`;
}
function provCardHTML(id, meta, entry, printedGrade) {      // printedGrade: 'a', 'b' or 'c' when the text has its printed page numbers marked, else ''
  const info = provInfo(id, meta, entry); const m = meta || {};
  const row = (k, v) => (v ? `<dt>${k}</dt><dd>${v}</dd>` : '');
  const link = (u, t) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)} ↗</a>`;
  const finder = info.scans.length ? `<div class="src-find"><label class="small" for="rdScanQ"><b>Find a page in the original scan</b></label>
      <div class="row tight" style="margin-top:6px"><input class="input" id="rdScanQ" type="search" placeholder="A few words from the page…" autocomplete="off" spellcheck="false" aria-label="Words to find in the original scan"><button class="btn sm" type="button" data-srcuse title="Fill in the words at the top of the page you are reading">Use this page</button></div>
      <div class="row tight" style="margin-top:8px">${info.scans.map((s, k) => `<a class="btn sm primary" data-srcgo="${k}" href="${esc(s.page)}" target="_blank" rel="noopener noreferrer">${esc(info.scans.length > 1 ? (s.label || 'Volume ' + (k + 1)) : 'Open the scan at these words')} ↗</a>`).join('')}</div>
      <p class="small muted" style="margin:6px 0 0">The Internet Archive’s own page searches inside the scan and shows the page as printed. It needs a connection; the Lamplighter Project itself sends nothing.</p></div>` : '';
  const pages = printedGrade && (info.pageNumbers === 'scan' || info.pageNumbers === 'web') ? `The printed page numbers are marked in the text (as p. 214)${info.pageNumbers === 'scan' ? ', found from the scan with the Internet Archive’s page data. The scan has every page, with its printed number.' : info.src ? ', from the source’s web edition, which follows the printed book.' : '.'}${pgmNote(printedGrade) ? ' ' + pgmNote(printedGrade) : ''}` : { scan: 'The scan has every page, with its printed number.', web: info.src ? 'The source’s web edition keeps the printed page numbers.' : '', verses: 'Chapters and verses are the page numbers of a Bible.', none: '' }[info.pageNumbers] || '';
  return `<div class="srccard" role="group" aria-label="Where this text comes from"><div class="src-head"><span class="tag src-kind">${esc(provBadge(info))}</span><b>Where this text comes from</b></div>
    <p class="small t2" style="margin:6px 0">${esc(provNotice(info, !!printedGrade))} ${esc(pages)}</p>
    <dl class="src-dl">${row('Edition', esc(info.by))}${row(info.copy ? 'Same edition at' : 'Source', info.src ? link(info.src, info.host || 'the source') : '')}${row('Rights', esc(info.licence))}${row('About this copy', m.note ? esc(m.note) : '')}</dl><p class="src-cite" style="margin:8px 0 0"><button type="button" class="btn sm" data-citeopen="${esc(id)}"${printedGrade ? ' data-printed="1"' : ''} title="Cite this edition in Chicago, BibTeX or RIS form: for a paper, Zotero, EndNote or LaTeX">Cite this text</button></p>${finder}${origHTML(entry)}</div>`;
}
/* the words typed or picked go into the finder's links, so a click (or a ctrl-click) opens the scan searched for them */
function provWireCard(box, info, phraseOf) {
  const q = box && box.querySelector ? box.querySelector('#rdScanQ') : null; if (!q) return;
  const upd = () => { box.querySelectorAll('[data-srcgo]').forEach((a) => { const s = info.scans[+a.dataset.srcgo]; if (s) a.href = provFindURL(s, q.value) || s.page; }); };
  q.addEventListener('input', upd);
  const use = box.querySelector('[data-srcuse]'); if (use) use.addEventListener('click', () => { q.value = provPhrase(phraseOf ? phraseOf() : '', 8); upd(); q.focus(); });
  upd();
}
/* a selected passage sent to its page in the scan: opens the scan searched for the first words; a text made of several volumes asks which volume */
async function provOpenScan(info, text) {
  const phrase = provPhrase(text, 8); if (!info || !info.scans.length) return false;
  const open = (u) => { try { const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.click(); } catch (e) { /* blocked */ } };      // a link followed by the reader's own click
  if (info.scans.length === 1) { open(provFindURL(info.scans[0], phrase)); return true; }
  const html = `<p class="small t2" style="margin-top:0">This text is made from ${info.scans.length} volumes, and the words “${esc(phrase)}” may be in any of them. Each link opens that volume’s scan, searched for the words.</p><div class="stack sm">${info.scans.map((s, k) => `<a class="btn" href="${esc(provFindURL(s, phrase) || s.page)}" target="_blank" rel="noopener noreferrer">${esc(s.label || 'Volume ' + (k + 1))} ↗</a>`).join('')}</div>`;
  await modal({ title: 'Which volume?', html, actions: [{ label: 'Close', kind: 'primary', value: true }] });
  return true;
}
if (typeof module !== 'undefined' && module.exports) module.exports = {};
