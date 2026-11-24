/* ═══════════════════════════ 6zy · Find your way: where someone who does not yet know where to begin begins ═══════════════════════════
   It used to be the first place of the app (“Start”). Since 18 November 2026 the app opens on the Timeline, and this page is kept under Timeline → More (and in the `/` search) at #/start: it asks one
   question, “what would you like to do?”, and gives four honest doors: find what fits (the traditions, by belief), follow the whole story (the Journey), read (the Library) and try a practice. Below
   them the four ways people have understood the sacred, with the questions people most often ask, and, for someone who has already begun, where they left off. Nothing here ranks one tradition above another. */
/* one card for a belief: its name, the scholars’ word, one line and three or four examples */
const beliefCardHTML = (b, n) => `<a class="card bcard fade-in" data-b="${b.id}" href="#/traditions/belief/${b.id}"><div class="bc-top"><span class="bc-ic">${icon(b.icon)}</span><b>${esc(b.label)}</b><span class="tag">${esc(b.term)}</span></div><p class="bc-line">${esc(b.short)}</p><p class="small muted">For example ${esc(b.ex)}.</p><span class="door-go">${n ? `Browse ${n} traditions` : 'Browse them'} →</span></a>`;
const START_QUESTIONS = [
  ['What do the traditions say about God, the soul and death?', '#/path/themes'],
  ['How do people actually worship?', '#/path/practices'],
  ['What do they all share, and where do they part?', '#/path/common'],
  ['Where did a religion come from, and what grew out of it?', '#/traditions/tree'],
  ['When and where did each one begin and spread?', '#/atlas'],
  ['What are their holy days, and how do they keep time?', '#/atlas/calendars'],
  ['I would like to sit quietly for a few minutes', '#/meditate'],
  ['I would like to worship or study with other people', '#/gather'],
];
Pages.start = {
  mount(root, parts, query) {
    const loc = secLocate('start'); const st = PATH.get(); const total = PATH_STATIONS.length; const started = !!st.started; const cur = PATH_STATIONS[Math.min(st.cur, total - 1)];
    const reading = typeof libContinueHTML === 'function' ? libContinueHTML() : '';
    const doors = [
      ['#/traditions', 'tree', 'Find what fits', 'Browse the world’s ways of worship by what they believe: one God, many gods, spirit in all things, or an inner path. Open any one to see its texts, its map, its calendar, where it came from and what grew from it.', 'Browse by belief'],
      ['#/path/today', 'path', 'Follow the whole story', started ? `You are at station ${Math.min(st.cur + 1, total)} of ${total}: ${cur.title}. Pick up where you left off, one short day at a time.` : `${total} short stations, a week each, from the first burials to now. Each has a story, a text and a practice, with questions for you if you want them.`, started ? 'Continue the Journey' : 'Begin the Journey'],
      ['#/path/library', 'book', 'Read the texts', `${LIB.length} texts in English, from scripture to field records and philosophy, arranged by belief. Search them all at once, compare passages and keep your own shelves.`, 'Open the Library'],
      ['#/path/practices', 'lotus', 'Try a practice', 'Sit, breathe, chant or pray the way others have, hear the sacred sound of the world’s traditions, or worship and study together with other people.', 'Ways to worship'],
    ];
    root.innerHTML = `${secHeadHTML(loc, { title: 'Find your way', blurb: 'New here, or not sure where to begin? Find the way of worship that fits you, follow the whole story of religion, read, or try a practice today.', compact: false })}${secNavHTML(loc, {})}
      ${started || reading ? `<section class="start-resume fade-in"><div class="card-title"><h3>${icon('clock')}Pick up where you left off</h3></div>${started ? `<a class="card flat start-st" href="#/path/today"><span class="eyebrow">Journey · station ${Math.min(st.cur + 1, total)} of ${total}</span><b>${esc(cur.title)}</b><span class="small muted">${esc(cur.when || '')}</span></a>` : ''}${reading}</section>` : ''}
      <h2 class="start-h">What would you like to do?</h2>
      <div class="start-doors">${doors.map(([href, ic, title, blurb, go]) => `<a class="card door fade-in" href="${href}"><span class="door-ic">${icon(ic)}</span><h3>${esc(title)}</h3><p>${esc(blurb)}</p><span class="door-go">${esc(go)} →</span></a>`).join('')}</div>
      <h2 class="start-h">Four ways people have understood the sacred</h2>
      <p class="t2 small start-sub">A way to find your bearings, not a ruling. Many traditions belong under two ideas, and every page says so.</p>
      <div class="bcards">${BELIEFS.filter((b) => b.id !== 'deep').map((b) => beliefCardHTML(b)).join('')}</div>
      <h2 class="start-h">Questions people ask</h2>
      <ul class="qlist">${START_QUESTIONS.map(([q, href]) => `<li><a href="${href}">${esc(q)} <span aria-hidden="true">→</span></a></li>`).join('')}</ul>
      <div class="callout start-note">${icon('shield')}<div><b>How the Lamplighter Project sees this.</b> It does not tell you what to believe and does not rank one tradition above another. Every claim says how well it is supported, an outsider’s account of what a people keep to themselves says that it is one, and nothing you do here leaves your browser.</div></div>`;
    if (reading && typeof libContinueFill === 'function') TXT.index().then((meta) => { if (meta) libContinueFill(root, meta); });
  },
};
