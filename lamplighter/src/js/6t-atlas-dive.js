/* ═══════════════════════════ 6t · Atlas "dive in" panel ═══════════════════════════
   Click a tradition on the map and this opens beside it: when it began, its own timeline (step through it and the map follows), what the Lamplighter Project holds on its
   beliefs and practice, its texts (read here where the text is in your folder), and its family. Everything comes from data already in the page. */
const ATL_DIVE_MAX = 36;

/* the Religion-section tradition that covers an Atlas tradition: by the tradition or an ancestor, then by family, then by colour group */
function atlPathTradFor(ix, id) {
  if (typeof ATL_FROM_PATH === 'undefined' || typeof TRAD_BY_ID === 'undefined' || !ix.trad[id]) return null;
  const ents = Object.entries(ATL_FROM_PATH).filter(([pid]) => TRAD_BY_ID[pid]); const chain = atlLineage(ix, id);
  for (const a of chain) { const hit = ents.find(([, m]) => m.sel === a); if (hit) return TRAD_BY_ID[hit[0]]; }
  for (const a of chain) { const f = ix.trad[a] && ix.trad[a].family_id; const hit = f && ents.find(([, m]) => m.f === f); if (hit) return TRAD_BY_ID[hit[0]]; }
  const g = ix.famGroup[ix.trad[id].family_id]; const hit = g && ents.find(([, m]) => m.g === g);
  return hit ? TRAD_BY_ID[hit[0]] : null;
}
/* a word to search the texts for: the bracketed name if there is one ("the Dreaming"), else the name without "religion" */
function atlSearchTerm(t) {
  const m = /\(([^)]+)\)/.exec(t.name); const raw = m ? m[1] : t.name.replace(/\s+religion$/i, '');
  return raw.replace(/^the\s+/i, '').trim();
}
/* the last timeline item on or before a year: where "you are" in this tradition's story */
function atlDiveNowIndex(items, y) { let at = -1; items.forEach((it, i) => { if (it.y <= y) at = i; }); return at; }

/* what opens an Atlas text record, or the plain sentence that says why nothing does (the five states are worked out by atlTextAccess in 2t-atlas-core.js). Every row that names a text goes through
   here, on the map's panel (its list of texts and its timeline), on a tradition's page and in the text catalogue, so no row is ever left silent: it opens the reader, or it says where the text is
   listed, or it says that the Library holds none (and, for an oral tradition, a lost work or one not yet deciphered, that there is nothing written to read). */
function atlReadBtn(x, opt) {
  const a = atlTextAccess(x, (id) => TXT.has(id)); const lib = (id) => (typeof LIB_BY_ID !== 'undefined' ? LIB_BY_ID[id] : null) || null; const kind = opt && opt.quiet ? 'ghost' : 'primary';      /* quiet: a plain button, for the rows of a timeline */
  if (a.state === 'none') { const lb = ATLD.ix && ATLD.ix.cfg ? ATLD.ix.cfg.text_category_groups.status_labels : null; return `<span class="small muted dv-none" title="The Lamplighter Project holds no public-domain or openly licensed copy of this to read here">${esc(atlTextNone(x, lb))}</span>`; }
  const q = encodeURIComponent((lib(a.first) || {}).title || x.title);
  if (a.state === 'listed') return `<a class="btn sm ghost" href="#/path/library?q=${q}" title="The Library lists this work but holds no public-domain or openly licensed copy to read here: its entry says where to read it">Where to read it</a>`;
  const imag = typeof libImagined === 'function' && libImagined(a.first) ? ' <span class="tag imagined" title="A work of the imagination, on the Library’s imagined shelf: not evidence, and never offered as scripture">Imagined</span>' : '';
  const more = a.state === 'parts' ? ` <a class="btn sm ghost" href="#/path/library?q=${encodeURIComponent(x.title)}" title="This work is held as ${a.ids.length} separate texts">All ${a.ids.length} parts</a>` : '';
  return `<a class="btn sm ${kind}" href="#/path/read/${a.first}"${a.state === 'part' ? ' title="The Library holds only part of this work"' : ''}>${a.state === 'part' ? 'Read part here' : a.state === 'parts' ? 'Read first part' : 'Read here'}</a>${more}${imag}`;
}
/* the sentence at the top of a tradition's list of texts: how many of its catalogued texts can be read here, said plainly (also when the answer is none) */
function atlTextsSummary(texts, nBooks) {
  const n = texts.length; if (!n) return ''; const st = texts.map((x) => atlTextAccess(x, (id) => TXT.has(id)).state);
  const read = st.filter((s) => s === 'read' || s === 'part' || s === 'parts').length; const listed = st.filter((s) => s === 'listed').length;
  const head = read ? `${read} of its ${n} catalogued text${n === 1 ? '' : 's'} can be read here` : n === 1 ? 'Its one catalogued text is not in the Library' : `None of its ${n} catalogued texts is in the Library`;
  return `${head}${listed ? `, and ${listed} more ${listed === 1 ? 'is' : 'are'} listed there without a copy to read` : ''}${nBooks ? `. The Library also holds ${nBooks} book${nBooks === 1 ? '' : 's'} about it, below` : ''}.`;
}
/* L-01 (FINAL_AUDIT.md): a pin on a site opens a panel for the SITE. A site the records tie to a religion names the site first (its title, where, when and the record's own note) and the religion under it, as the
   panel of that religion was; a site that names no tradition (17 of 488: Mapungubwe, Serpent Mound, the Sanxingdui pits …) gets a panel of its own, the same one for each, that says so. */
const atlSiteWhere = (ix, s) => { const c = ix && ix.countries && ix.countries[s.country_iso2]; return [c ? c[0] : '', s.date_label || ''].filter(Boolean).join(' · '); };
function atlSiteTopHTML(ix, s) {
  const conf = ATL_CONF[s.date_confidence] || '';
  return `<h2 class="dv-title" id="dvTitle" tabindex="-1">${esc(s.name)}</h2><div class="t2 small dv-keep">${esc(atlSiteWhere(ix, s))}${conf ? ` <span class="muted">· ${esc(conf)}${s.circa ? ' · approximate' : ''}</span>` : ''}</div>${s.note ? `<p class="dv-sum dv-site-x">${esc(s.note)}</p>` : ''}`;
}
const atlDiveButtonsHTML = () => `<span class="row tight"><button class="btn sm ghost dv-min" type="button" data-dive-min aria-expanded="true" title="Show only the title, to see more of the map">${icon('chevron')}<span class="sr-only-live">Show or hide the details</span></button><button class="btn sm ghost" type="button" data-dive-close aria-label="Close the details">${icon('x')}</button></span>`;
function atlSiteHTML(o) {
  const { ix, s } = o;
  return `<div class="dv-head"><div class="dv-eyebrow">A site on the map${s.type ? ' · ' + esc(s.type) : ''}</div>${atlDiveButtonsHTML()}</div>
    ${atlSiteTopHTML(ix, s)}
    <div class="dv-body"><p class="small t2">The map data records no tradition for this site, so none is named here.</p>
    <div class="row dv-go"><a class="btn sm" href="${srchHash(s.name, srchOpts({}))}">${icon('search')}Search every text for “${esc(s.name)}”</a></div></div>`;
}
function atlDiveHTML(o) {
  const { ix, t, tl, all, texts, prac, rows, color, pt, curY, site } = o;
  const fam = ix.fam[t.family_id] || { name: t.family_id }; const kind = (((ix.codes.tradition_kind || {})[t.kind]) || t.kind || '').replace(/ \(.*/, ''); const status = (ix.codes.tradition_status || {})[t.status] || t.status || '';
  const lin = atlLineage(ix, t.id).slice(1).reverse(); const kids = (ix.kids[t.id] || []).slice(0, 14);
  const kin = Object.values(ix.trad).filter((x) => x.family_id === t.family_id && x.id !== t.id && !lin.includes(x.id) && !kids.includes(x.id)).sort((a, b) => (a.start_year || 0) - (b.start_year || 0)).slice(0, 10);
  const now = atlDiveNowIndex(tl.items, curY); const term = atlSearchTerm(t); const oral = t.kind === 'eth';
  const rank = (x) => (x.lib && TXT.has(x.lib) ? 0 : x.lib ? 1 : 2); const tx = texts.slice().sort((a, b) => rank(a) - rank(b) || (a.year_start || 0) - (b.year_start || 0));
  const sts = pt && typeof tradStations === 'function' ? tradStations(pt) : []; const ptTexts = pt && typeof tradTexts === 'function' ? tradTexts(pt) : [];
  const words = pt && typeof GLOSSARY !== 'undefined' ? GLOSSARY.filter((g) => Array.isArray(g[4]) && g[4].includes(pt.id)).slice(0, 10) : [];
  /* a Text row on the timeline names a catalogue record (its ref): it gets the same way in to the reader, or the same plain sentence, as the list of texts below. The row itself still moves the map. */
  const txBy = Object.fromEntries(texts.map((x) => [x.id, x])); const act = (it) => { const x = it.kind === 'text' && it.ref ? txBy[it.ref] : null; return x ? `<div class="dv-act">${atlReadBtn(x, { quiet: true })}</div>` : ''; };
  const li = (it, i) => `<li class="dv-it k-${it.kind}${i === now ? ' now' : ''}" data-i="${i}"><button type="button" class="dv-row" data-jump="${i}"${i === now ? ' aria-current="true"' : ''}><span class="dv-when"><b>${esc(atlFmtYear(it.y))}</b>${it.ye != null && it.ye !== it.y ? `<span class="small muted">to ${esc(atlFmtYear(it.ye))}</span>` : ''}</span><span class="dv-what"><span class="tag">${esc(ATL_TL_KIND[it.kind] || it.kind)}</span> ${esc(it.label)}</span></button>${act(it)}</li>`;
  /* the Library's own books about this tradition, and the old sources a revival draws on: the same lists as on the tradition's page (tools/library_about.json, tools/library_lore.json) */
  const lore = typeof aboutIds === 'function' ? aboutIds(ix.core.lore, t.id, LIB_BY_ID) : []; const about = typeof aboutIds === 'function' ? aboutIds(ix.core.about, t.id, LIB_BY_ID).filter((x) => !lore.includes(x)) : []; const nBooks = about.length + lore.length;
  const eyebrow = `${esc(fam.name)} · ${esc(kind)} · ${esc(status)}`;      /* opened on a site (L-01): the site is the title, its religion comes under it with its own line */
  return `<div class="dv-head"><div class="dv-eyebrow">${site ? 'A site on the map' + (site.type ? ' · ' + esc(site.type) : '') : eyebrow}</div>${atlDiveButtonsHTML()}</div>
    ${site ? `${atlSiteTopHTML(ix, site)}<div class="dv-tie dv-site-x"><div class="dv-eyebrow">The religion the map ties it to · ${eyebrow}</div></div>` : ''}<${site ? 'h3' : 'h2'} class="dv-title${site ? ' dv-trad' : ''}"${site ? '' : ' id="dvTitle" tabindex="-1"'}>${esc(t.name)}</${site ? 'h3' : 'h2'}>${t.name_original ? `<div class="t2 small">${esc(t.name_original)}</div>` : ''}
    <div class="dv-body">
    <div class="dv-date dv-keep"><b>${esc(atlDate(t))}</b> <span class="muted small">${esc(ATL_CONF[t.date_confidence] || '')}${t.start_circa ? ' · approximate' : ''}</span></div>
    <p class="dv-sum">${esc(t.summary || '')}</p>
    ${oral || t.date_confidence === 'L' ? '<p class="hint dv-hint">Dates for oral and Indigenous traditions are rough. The start marks when a recognisable tradition is attested or reasonably inferred, not when a people’s spiritual life began.</p>' : ''}
    <div class="row dv-go dv-keep"><button class="btn sm primary dv-more" type="button" data-dive-more>Timeline, beliefs and texts</button><a class="btn sm primary dv-full" href="#/atlas/tradition/${t.id}" title="The page for this tradition: its roots and branches, texts, sites, practices and calendar">Tradition page</a><button class="btn sm" type="button" data-dive-start>Go to its beginning</button></div>
    <div class="row tight dv-step dv-keep"><button class="btn sm" type="button" data-dive-step="-1" aria-label="Previous moment in its history"><span aria-hidden="true">←</span> <span>Earlier</span></button><button class="btn sm" type="button" data-dive-step="1" aria-label="Next moment in its history"><span>Later</span> <span aria-hidden="true">→</span></button><span class="small muted">Step through its history; the map follows.</span></div>
    <div class="dv-nowline small dv-keep" id="dvNow"></div>
    <nav class="dv-nav" aria-label="Sections"><button type="button" data-dv="dvTl">Timeline</button><button type="button" data-dv="dvBel">Beliefs</button><button type="button" data-dv="dvTx">Texts <span class="muted">${texts.length + nBooks}</span></button><button type="button" data-dv="dvFam">Family</button></nav>

    <section class="dv-sec" id="dvTl" aria-labelledby="dvTlH"><div class="card-title"><h3 id="dvTlH">Timeline</h3><span class="muted small">${tl.total} dated record${tl.total === 1 ? '' : 's'}</span></div>
      ${rows.length ? `<div class="dv-strip">${atlTimelineSVG(ix, rows, color)}</div>` : ''}
      <ol class="plain dv-list" id="dvList">${tl.items.map(li).join('')}</ol>
      ${tl.total > tl.items.length ? `<p class="small"><button class="btn sm ghost" type="button" data-dive-all>Show all ${tl.total}</button> <span class="muted">The ${tl.items.length} most important are shown.</span></p>` : all && tl.total > ATL_DIVE_MAX ? '<p class="small"><button class="btn sm ghost" type="button" data-dive-few>Show fewer</button></p>' : ''}
    </section>

    <section class="dv-sec" id="dvBel" aria-labelledby="dvBelH"><div class="card-title"><h3 id="dvBelH">Beliefs and practice</h3></div>
      ${pt ? `<div class="dv-pt"><div class="small muted">In the Journey</div><b>${esc(pt.name)}</b><p class="small t2" style="margin:4px 0 8px">${esc(pt.blurb)}</p>
        <div class="row tight"><a class="btn sm primary" href="#/path/tradition/${pt.id}" title="The Journey for ${esc(pt.short || pt.name)}: its stations, timeline and readings">Journey</a>${sts.length ? `<a class="btn sm" href="#/path/station/${sts[0].id}">Start at station ${stNum(sts[0])}</a>` : ''}<a class="btn sm ghost" href="#/path/passage?t=${pt.id}" title="A random passage from this tradition">${icon('dice')}Random</a></div>
        ${sts.length ? `<ul class="plain small dv-sts">${sts.slice(0, 5).map((s) => `<li><a href="#/path/station/${s.id}"><span class="muted">${stNum(s)}.</span> ${esc(s.title)}</a></li>`).join('')}</ul>${sts.length > 5 ? `<p class="small muted">${sts.length - 5} more stations on its page.</p>` : ''}` : ''}</div>` : '<p class="small t2">The Journey has no stations for this one yet. What the map data holds is above and in the texts and timeline.</p>'}
      ${words.length ? `<div class="small" style="margin-top:10px"><span class="muted">Words to know</span><div class="row tight" style="margin-top:4px">${words.map((g) => `<a class="chip" href="#/path/glossary?q=${encodeURIComponent(g[0])}" title="${esc(g[3])}">${esc(g[0])}</a>`).join('')}</div></div>` : ''}
      ${prac.length ? `<div class="small" style="margin-top:10px"><span class="muted">Ways of reaching toward the divine</span><div class="row tight" style="margin-top:4px">${prac.map((p) => `<a class="chip" href="#/atlas?p=${p.id}&y=${atlSnap(curY)}" title="${esc(p.description)}">${esc(p.name)}</a>`).join('')}</div>${atlPracticeBridges(prac)}</div>` : ''}
      <div class="row dv-go" style="margin-top:10px"><a class="btn sm" href="${srchHash(term, srchOpts({}))}">${icon('search')}Search every text for “${esc(term)}”</a></div>
      ${oral ? '<p class="hint dv-hint">Much of this knowledge belongs to particular communities and some of it is restricted by them. The Lamplighter Project holds what the open record contains, mostly outsiders’ accounts (labelled as such), and maps only the places that record names. Early outside accounts carry their authors’ views; community-led sources speak for themselves.</p>' : ''}
      ${t.kind === 'arch' ? '<p class="hint dv-hint">This is an archaeological grouping, inferred from burials, art and monuments. It is not a self-named religion.</p>' : ''}
    </section>

    <section class="dv-sec" id="dvTx" aria-labelledby="dvTxH"><div class="card-title"><h3 id="dvTxH">Texts <span class="tag">${texts.length + nBooks}</span></h3>${texts.length ? `<a class="small" href="#/atlas/texts?t=${t.id}">All in the catalogue →</a>` : ''}</div>
      ${tx.length ? `<p class="small dv-sumtx">${esc(atlTextsSummary(texts, nBooks))}</p><ul class="plain dv-texts">${tx.slice(0, 8).map((x) => `<li><div><b>${esc(x.title)}</b><div class="small muted">${esc(atlTextCat(ix, x.category))} · ${esc(x.language || '')} · ${esc(x.date_label || '')}</div></div><span class="row tight">${atlReadBtn(x)}</span></li>`).join('')}</ul>${tx.length > 8 ? `<p class="small"><a href="#/atlas/texts?t=${t.id}">${tx.length - 8} more in the catalogue</a></p>` : ''}<p class="hint dv-hint">These are catalogue records, not the texts themselves. “Read here” opens the text in the Library; where it says the Library holds none, no public-domain or openly licensed copy is kept here.</p>` : `<p class="small t2">No texts are catalogued for this tradition${nBooks ? '' : ', and the Library holds no book about it'}. Many oral traditions have none written down; they are better understood through their practices, their places and the people who keep them.</p>`}
      ${typeof tradLoreHTML === 'function' ? tradLoreHTML(lore) + tradAboutHTML(about) : ''}
      ${ptTexts.length ? `<p class="small">The Library also holds ${ptTexts.length} text${ptTexts.length === 1 ? '' : 's'} alongside this: <a href="#/path/tradition/${pt.id}">see them</a>.</p>` : ''}
    </section>

    <section class="dv-sec" id="dvFam" aria-labelledby="dvFamH"><div class="card-title"><h3 id="dvFamH">Family</h3></div>
      ${lin.length ? `<div class="small"><span class="muted">Descended from</span> ${lin.map((id) => `<a href="#" data-sel="${id}">${esc(ix.trad[id].name)}</a>`).join(' › ')}</div>` : '<div class="small t2">A root: no parent tradition is recorded.</div>'}
      ${kids.length ? `<div class="small" style="margin-top:6px"><span class="muted">Gave rise to</span> ${kids.map((id) => `<a href="#" data-sel="${id}">${esc(ix.trad[id].name)}</a>`).join(', ')}</div>` : ''}
      ${kin.length ? `<div class="small" style="margin-top:6px"><span class="muted">Also in ${esc(fam.name)}</span> ${kin.map((x) => `<a href="#" data-sel="${x.id}">${esc(x.name)}</a>`).join(', ')}</div>` : ''}
    </section>
    ${typeof relatedBox === 'function' && o.siteId ? relatedBox('site', o.siteId, { skip: ['map', 'traditions'] }) : ''}</div>`;      /* the map was opened on a site (a pin from a tradition's page or the Library): what the records tie that site to, with the other sites already on the map; the religion is the panel's own “Tradition page” button, so the strip does not list it again (L-11 of the polish round: skip traditions) */
}
