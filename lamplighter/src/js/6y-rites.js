/* ═══════════════════════════ 6y · Rites and customs (Worship → Ways to worship → Rites and customs) ═══════════════════════════
   Where familiar customs and strange old ones came from, with the evidence graded: attested, probable, debated, or a popular story without good evidence. From the birthday candle and Christmas
   to spells, the evil eye, human sacrifice and killing for the faith, said plainly. Data: 2z-data-rites.js. Each card points into the library (a motif page, books to read, words to search). */
function pathRitesView(root, query) {
  const body = root.querySelector('#pbody'); const kind = RITE_KINDS[query.k] ? query.k : ''; const open = RITE_BY_ID[query.r] ? query.r : '';
  const list = RITES.filter((r) => !kind || r.kind === kind);
  const groups = Object.entries(RITE_KINDS).filter(([k]) => !kind || kind === k).map(([k, n]) => [n, list.filter((r) => r.kind === k)]).filter(([, l]) => l.length);
  const card = (r) => {
    const g = RITE_GRADES[r.grade]; const m = typeof simMotifInit === 'function' ? simMotifInit().find((x) => x.id === r.motif) : null;
    return `<details class="card flat rite" id="rite-${r.id}"${open === r.id ? ' open' : ''}><summary><span class="rite-sum"><span class="rite-name">${esc(r.name)}</span><span class="rite-meta"><span class="tag rite-${r.grade}" title="${esc(g[1])}">${esc(g[0])}</span><span class="small muted">${esc(r.where)}</span></span></span><span class="small t2" style="display:block;margin-top:4px">${esc(r.what)}</span></summary>
      <div class="rite-body"><h4>Earliest evidence</h4><p>${esc(r.earliest)}</p><h4>How it travelled or changed</h4><p>${esc(r.travelled)}</p><h4>How sure we are: <span class="rite-${r.grade}-t">${esc(g[0])}</span></h4><p>${esc(r.why)}</p>
        ${r.care ? `<div class="callout" style="margin:10px 0">${icon('info')}<div>${esc(r.care)}</div></div>` : ''}
        <div class="row tight" style="margin-top:8px">${m ? `<a class="btn sm primary" href="#/path/motif/${m.id}">${icon('swap')}How traditions keep this: ${esc(m.name)}</a>` : ''}${r.books.filter((b) => LIB_BY_ID[b]).map((b) => `<a class="btn sm" href="#/path/read/${b}">${esc(LIB_BY_ID[b].title.split(/[:,(]/)[0].slice(0, 30))}</a>`).join('')}${r.search ? `<a class="btn sm ghost" href="#/path/search?q=${encodeURIComponent(r.search)}">${icon('search')}Search the library for “${esc(r.search)}”</a>` : ''}${r.more ? `<a class="btn sm primary" href="#/path/${r.more[0]}">${esc(r.more[1])}</a>` : ''}</div></div></details>`;
  };
  body.innerHTML = `<p class="t2 small" style="max-width:76ch">Where customs came from, said as carefully as the evidence allows: the birthday candle and Christmas, fasting and pilgrimage, spells and the evil eye, and the hard parts of history, human sacrifice and killing for the faith. Each card says what is documented, how sure we are, and where in the library to read the sources. A popular story that has no good evidence behind it is called one. These pages are here to help you feel less alone in what people have always done and feared and hoped for, and are not meant to make anyone’s practice smaller.</p>
    <div class="row tight" style="margin:12px 0" role="group" aria-label="Kind of custom"><a class="chip${kind ? '' : ' on'}" href="#/path/rites">Everything</a>${Object.entries(RITE_KINDS).map(([k, n]) => `<a class="chip${kind === k ? ' on' : ''}" href="#/path/rites?k=${k}">${esc(n)}</a>`).join('')}</div>
    <div class="row tight small" style="margin-bottom:10px"><span class="muted">How sure:</span>${Object.entries(RITE_GRADES).map(([k, v]) => `<span class="tag rite-${k}" title="${esc(v[1])}">${esc(v[0])}</span>`).join('')}</div>
    ${groups.map(([n, l]) => `<h2 style="margin:22px 0 10px;font-size:18px">${esc(n)}</h2><div class="stack sm">${l.map(card).join('')}</div>`).join('')}`;
  if (open) { const el = document.getElementById('rite-' + open); if (el && el.scrollIntoView) setTimeout(() => el.scrollIntoView({ block: 'start' }), 50); }
}
if (typeof module !== 'undefined' && module.exports) module.exports = {};
