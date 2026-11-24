/* ═══════════════════════════ 6zx · The dictionary in the app: Look up, the Glossary page and the search box ═══════════════════════════
   The lookup itself is in 2z-dict-core.js. This file loads its files (dictionary/index.js, then the one file or two that hold the word, by script tag from the folder beside Lamplighter.html, as the texts
   are, so it works offline and from file://) and writes what was found as a section of a page: the headword, what part of speech, each meaning with its subject label (Bot., Zoöl.) and usage label
   (obsolete, rare), the synonyms, and a note where an entry speaks of peoples or faiths in the words of 1913. A word that is a form of another (begot, climates, thou knowest) says what it is
   and shows that word. Nothing is fetched or sent: a missing folder only means this copy has no dictionary, and the section says so. */
const DICT = {
  base: 'dictionary/', _p: {}, _idx: null,
  script(name) {
    if (!DICT._p[name]) DICT._p[name] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.charset = 'utf-8'; s.src = DICT.base + name + '.js';
      s.onload = () => { delete DICT._p[name]; try { s.remove(); } catch (e) { /* gone */ } res(); };
      s.onerror = () => { delete DICT._p[name]; try { s.remove(); } catch (e) { /* gone */ } rej(new Error('missing ' + name)); };
      document.head.appendChild(s);
    });
    return DICT._p[name];
  },
  index() { if (!DICT._idx) DICT._idx = DICT.script('index').then(() => BEATLAB_DICT.meta, (e) => { DICT._idx = null; throw e; }); return DICT._idx; },
  async load(id) { if (!BEATLAB_DICT.has(id)) await DICT.script(id); return BEATLAB_DICT.by[id]; },
  /* what the dictionary has for some selected words: { ok: false } when its files are not here, else { ok: true, items: [{ text, res }] } */
  async lookup(text) {
    let meta; try { meta = await DICT.index(); } catch (e) { return { ok: false, items: [] }; }
    try { return { ok: true, items: await dkFindText(text, meta, DICT.load) }; } catch (e) { return { ok: false, items: [] }; }
  },
};
const DK_KIND = { 'adv.': 'the adverb of', 'n.': 'the noun of', 'a.': 'the adjective of', 'pl.': 'the plural of', form: 'a form of', '': 'another spelling of' };
function dictEntryHTML(e) {
  const meta = [e.syl, e.pos].filter(Boolean).map(esc).join(' · ');
  const li = (s) => `<li>${dkMarkup(s, esc)}</li>`; const shown = e.senses.slice(0, 4); const rest = e.senses.slice(4);
  const refs = [...new Set(e.senses.slice(0, 3).flatMap((s) => dkRefs(s, e.heads)))].slice(0, 4);
  const senses = !e.senses.length ? '' : e.senses.length === 1 ? `<p class="dk-one">${dkMarkup(e.senses[0], esc)}</p>`
    : `<ol class="dk-senses">${shown.map(li).join('')}</ol>${rest.length ? `<details class="dk-more"><summary>${rest.length} more meaning${rest.length === 1 ? '' : 's'}</summary><ol class="dk-senses" start="5">${rest.map(li).join('')}</ol></details>` : ''}`;
  return `<div class="dk-entry"><div class="dk-head"><b class="dk-hw">${e.heads.slice(0, 3).map(esc).join(', ')}</b>${meta ? ` <span class="muted small">${meta}</span>` : ''}</div>${senses}${e.syn ? `<p class="small t2 dk-syn"><b>Syn.</b> ${esc(e.syn)}</p>` : ''}${refs.length ? `<p class="small dk-refs">${refs.map((r) => `<button class="dk-link" type="button" data-dkw="${esc(r)}">${esc(r)} →</button>`).join(' ')}</p>` : ''}</div>`;
}
function dictItemHTML(it) {
  const { text, res } = it; let note = '';
  if (res.how !== 'exact') note += `<p class="small t2 dk-note">“${esc(text)}” looks like ${DK_HOW[res.how] || 'a form of'} <b>${esc(res.key)}</b>, which is shown.</p>`;
  res.via.forEach((v) => { note += `<p class="small t2 dk-note">“${esc(v.key)}” is ${DK_KIND[v.kind] || 'a form of'} <b>${esc(v.to)}</b>, which is shown.</p>`; });
  const all = res.entries.map(dictEntryHTML); const more = all.slice(5);
  const care = res.entries.some((e) => e.care) ? '<p class="small dk-care">This speaks of peoples or faiths in the words of 1913, which can be hostile, mistaken or out of date. It is shown so that it can be understood, not endorsed.</p>' : '';      // said once for the word, not under every entry
  return `<div class="dk-item">${note}${all.slice(0, 5).join('')}${more.length ? `<details class="dk-more"><summary>${more.length} more entr${more.length === 1 ? 'y' : 'ies'}</summary>${more.join('')}</details>` : ''}${care}</div>`;
}
/* the whole section for a selection: its entries, or what to do when there are none, and the standing line about what this dictionary is */
function dictSectionHTML(r, text, back, link) {
  const cap = `<p class="hint dk-cap">Webster’s Revised Unabridged Dictionary, 1913 (public domain), kept in the Lamplighter Project’s own files: nothing is sent. It is a book of its time, with old words and old views; the quotations and word histories are left out.${link ? ` <a href="#/path/glossary?q=${encodeURIComponent(String(text).slice(0, 60))}">More in the Glossary →</a>` : ''}</p>`;
  const bk = back ? `<p class="small" style="margin:0 0 6px"><button class="dk-link" type="button" data-dkw="${esc(back)}">← back to “${esc(back)}”</button></p>` : '';
  if (!r.ok) return '<p class="small t2 dk-miss">This copy of the Lamplighter Project has no dictionary: it is an optional folder, <b>dictionary/</b>, that sits beside Lamplighter.html.</p>';
  if (String(text).split(/\s+/).filter(Boolean).length > 4) return '<p class="small t2">Select one word, or a short phrase, to see it in the dictionary.</p>';
  if (!r.items.length) return `${bk}<p class="small t2">Not in the dictionary either. It is Webster’s of 1913, so newer words are missing, and so are most names and foreign words.</p>`;
  return bk + r.items.map(dictItemHTML).join('') + cap;
}
/* fill a box with the dictionary's answer for some words, and make the arrows in it look up the word they point to (and a link back) */
async function dictFill(box, text, back) {
  try {
    if (!box) return; const q = String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, 120); if (!q) return;
    box.innerHTML = '<p class="small muted dk-wait">Looking in the dictionary…</p>'; box.dataset.dkq = q;
    const r = await DICT.lookup(q); if (!box.isConnected || box.dataset.dkq !== q) return;
    box.innerHTML = dictSectionHTML(r, q, back, box.dataset.dklink !== '0');
    if (!box.__dkWired && box.addEventListener) { box.__dkWired = true; box.addEventListener('click', (e) => { const b = e.target && e.target.closest ? e.target.closest('[data-dkw]') : null; if (b) { e.preventDefault(); dictFill(box, b.dataset.dkw, box.dataset.dkq); } }); }
  } catch (e) { /* the page went away, or the files are not here: the box keeps what it had */ }
}
