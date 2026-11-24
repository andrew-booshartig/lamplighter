/* ═══════════════════════════ 6zzf · Your data: the page, and Export all and Import (Setup → Your data, #/setup/data) ═══════════════════════════
   The page lists every kind of data this browser keeps for the Lamplighter Project, each with a plain count, what it is for and a button of its own that asks first, names what goes and says whether it can be undone.
   The small things can be put back for about eight seconds (a snackbar with Undo); a notebook, a text of your own, a PDF and the offline copies cannot. At the foot: Export all (PDFs are left out: each is saved from its own row)
   and, as the last line, Delete everything, whose question lists every category with its count and which also removes the PDFs and the offline copies. Nothing here deletes a file on the computer's disk.
   The arithmetic (what is kept, what each button changes, what each question says) is 2z-data-core.js and is tested with a pretend storage (tests/data.test.js); this file hands it the real one and draws the result. */
const YD = { undo: null, seq: 0, paint: null };      /* paint: draws the open page again in place (so Undo does not send you back to the top) */
/* the real storage, in the shape 2z-data-core.js asks for: the app's own store, the three IndexedDB databases (through the modules that own them, so a database is never made here) and the saved libraries */
function dataRealStorage() {
  const mods = { 'lamplighter-notebook': () => (typeof NBS !== 'undefined' ? NBS : null), 'beatlab-own': () => (typeof OWN !== 'undefined' ? OWN : null), 'lamplighter-pdfs': () => (typeof BOOKS_DB !== 'undefined' ? BOOKS_DB : null) };
  const tx = (db, mode, fn) => { const m = mods[db] && mods[db](); if (!m) return Promise.reject(new Error('That storage is not here.')); return m.tx(mode, fn); };
  return {
    ls: { keys: () => Object.keys(store.all()), get: (k, d) => store.get(k, d), set: (k, v) => store.set(k, v), del: (k) => store.del(k) },
    idb: { rows: (db) => tx(db, 'readonly', (os) => os.getAll()).then((r) => r || []), del: (db, s, keys) => tx(db, 'readwrite', (os) => { keys.forEach((k) => os.delete(k)); }), clear: (db) => tx(db, 'readwrite', (os) => os.clear()), put: (db, s, r) => tx(db, 'readwrite', (os) => os.put(r)) },
    caches: { list: () => (typeof OFF !== 'undefined' ? OFF.copies() : Promise.resolve([])), delete: (n) => (typeof OFF !== 'undefined' ? OFF.drop(n) : Promise.resolve(false)) },
  };
}
/* Export all: the app's own store, the texts you added and every page of every notebook, in one file (PDFs are not in it) */
async function dataExportAll() {
  let own = []; try { if (typeof OWN !== 'undefined') own = await OWN.dump(); } catch (e) { /* no own texts to add */ }
  let nb = []; try { if (typeof NB !== 'undefined') nb = await NB.dump(); } catch (e) { /* no notebook pages to add */ }
  download(`lamplighter-backup-${isoDay()}.json`, JSON.stringify(dataBackupMake({ name: APP.name, version: APP.version, exportedAt: new Date().toISOString() }, store.all(), own, nb), null, 2));
}
/* Import: replaces what is stored in the app's own store with the backup's; the texts you added and the notebook pages in it are added (a page with the same id is replaced by the backup's copy; nothing is removed), and the
   notebooks you have are kept (a backup made before there were several notebooks does not list any) */
async function dataImportFile(f) {
  const d = JSON.parse(await f.text()); if (!backupOk(d, APP)) throw new Error('Not a Lamplighter backup');
  const parts = dataBackupRead(d); const hasNb = parts.notebook.length > 0;
  const ok = await confirmBox('Replace your data?', '<p>This replaces everything currently stored in the Lamplighter Project with the backup.</p>' + (hasNb ? '<p class="small t2">Your notebooks are not emptied: the pages in the backup are added to them, and a page with the same id is replaced by the backup’s copy. A notebook you have that the backup does not hold stays.</p>' : '') + '<p class="small t2">PDFs you added are not touched: a backup never holds them.</p>', 'Replace', 'danger');
  if (!ok) return false;
  const keptBooks = store.get('notebook.books', null); store.clear(); Object.entries(parts.data).forEach(([k, v]) => store.set(k, v));
  if (typeof nbBooksMerge === 'function' && (keptBooks || parts.hasBooks)) { const merged = nbBooksMerge(keptBooks, parts.hasBooks ? parts.data['notebook.books'] : null); if (merged.length) store.set('notebook.books', merged); }
  if (parts.own.length && typeof OWN !== 'undefined') { try { await OWN.restore(parts.own); } catch (e) { toast('Your own texts could not be restored: ' + esc(e.message), 'warn', 5000); } }
  if (typeof NB !== 'undefined') { try { await NB.restore(parts.notebook); } catch (e) { toast('Your notebook could not be restored: ' + esc(e.message), 'warn', 5000); } }
  toast('Backup restored — reloading', 'good'); setTimeout(() => location.reload(), 800); return true;
}
/* the dialog for a button: what goes, in lines, and a way out */
const ydConfirmHtml = (c) => `${c.intro ? `<p>${esc(c.intro)}</p>` : ''}${c.lines.length ? `<ul class="yd-sum">${c.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}${c.notes.map((n) => `<p class="small t2">${esc(n)}</p>`).join('')}`;
const ydTitleOf = (id) => (typeof LIB_BY_ID !== 'undefined' && LIB_BY_ID[id] ? LIB_BY_ID[id].title : id);
const ydBtn = (act, id, label, cls, dis) => `<button type="button" class="btn sm ${cls || ''}" data-yd="${act}" data-id="${esc(id)}"${dis ? ' disabled' : ''}>${label}</button>`;
function ydActions(r) {
  if (r.item === 'notebook') return ydBtn('export-book', r.bookId, 'Export') + ydBtn('del', r.id, r.only ? 'Delete its pages…' : 'Delete…', 'danger', r.empty);
  if (r.item === 'own') return `<a class="btn sm" href="#/path/read/${esc(r.textId)}">Open</a>` + ydBtn('del', r.id, 'Delete…', 'danger');
  if (r.item === 'pdf') return `<a class="btn sm" href="#/path/read/${esc(r.pdfId)}">Open</a>` + ydBtn('save-pdf', r.pdfId, 'Save a copy') + ydBtn('del', r.id, 'Delete…', 'danger');
  const label = r.id === 'prefs' ? 'Reset to defaults…' : r.id === 'progress' ? 'Reset…' : r.id === 'remembered' ? 'Forget…' : r.id === 'journey' ? 'Reset…' : r.id === 'offline' ? 'Remove…' : 'Remove all…';
  return ydBtn('del', r.id, label, 'danger', r.empty);
}
function ydRowHtml(r, sum) {
  if (r.item === 'none') return `<div class="yd-row yd-none"><div class="yd-main"><div class="yd-line"><span class="yd-name">${esc(r.label)}</span></div><p class="yd-what">Add a text or a PDF of your own under Library → More → <a href="#/path/own">Your own texts</a>.</p></div></div>`;
  let more = '';
  if (r.id === 'bookmarks' || r.id === 'highlights') {
    const per = sum.counts.marks.per.filter((x) => (r.id === 'bookmarks' ? x.bm : x.hl)).slice(0, 80); const k = r.id === 'bookmarks' ? 'bm' : 'hl';
    if (per.length) more = `<details class="yd-more"><summary>By text</summary><ul class="yd-by">${per.map((x) => `<li><a href="#/path/read/${esc(x.id)}">${esc(ydTitleOf(x.id))}</a><span class="muted">${x[k]}</span></li>`).join('')}</ul></details>`;
  }
  return `<div class="yd-row${r.empty ? ' yd-empty' : ''}" data-row="${esc(r.id)}"><div class="yd-main"><div class="yd-line"><b class="yd-name">${esc(r.label)}</b><span class="yd-count">${esc(r.text)}</span></div>${r.what ? `<p class="yd-what">${esc(r.what)}</p>` : ''}${more}</div><div class="yd-act">${ydActions(r)}</div></div>`;
}
/* one pending undo at a time: a new removal makes the earlier snackbar’s button go, because putting back an older state would also put back what the newer one removed */
function ydClearUndo() { YD.undo = null; try { document.querySelectorAll('.toast .yd-undo').forEach((b) => { const t = b.closest('.toast'); if (t) t.remove(); }); } catch (e) { /* no toasts */ } }
/* after a part is gone, what the running app holds in memory about it is let go too */
async function ydAfter(id) {
  try {
    if (id.startsWith('book:') || id === 'everything') { if (typeof NB !== 'undefined' && NB.reload) await NB.reload(); }
    if (id.startsWith('own:') && typeof OWN !== 'undefined') OWN.unregister(id.slice(4));
    if (id.startsWith('pdf:') && typeof BOOKS !== 'undefined') BOOKS.forget(id.slice(4));
    if (id === 'prefs') ydApplyPrefs();
  } catch (e) { console.error(e); }
}
/* preferences are applied to the running app as they are put back to defaults (or back as they were) */
function ydApplyPrefs() {
  const s = store.get('settings', {}); Settings.data = Object.assign({ onboarded: false, hpChecked: false }, DATA_PREF_DEFAULTS, s && typeof s === 'object' ? s : {});
  try { applyTheme(); } catch (e) { /* no page yet */ } try { if (typeof AudioCore !== 'undefined') AudioCore.setCap(Settings.get('volumeCap')); } catch (e) { /* no audio */ } try { refreshNavQuiet(); } catch (e) { /* no menu */ }
}
const refreshNavQuiet = () => { const n = $('.nav'); if (n) n.innerHTML = navInner(); };
const ydHere = () => /^#\/setup\/data/.test(location.hash);

function dataPageMount(root) {
  const st = dataRealStorage(); let alive = true; const cleanups = [];
  root.innerHTML = `${secHeadHTML(secLocate('setup/data'), { compact: true })}<div class="yd" id="yd"><p class="yd-lede">Everything the Lamplighter Project remembers about you is kept in this browser, on this device. Each kind is listed with what it holds and a button of its own; nothing is removed until you confirm, and <b>nothing here deletes a file on your computer’s disk</b>.</p><div id="ydBody"><p class="yd-wait">Looking at what is kept…</p></div></div>`;
  const body = root.querySelector('#ydBody');
  const paint = async () => {
    const snap = await dataSnapshot(st); if (!alive) return snap; const sum = dataSummary(snap);
    body.innerHTML = `${sum.groups.map((g) => `<section class="yd-group" aria-labelledby="ydg-${g.id}"><h2 class="yd-gt" id="ydg-${g.id}">${esc(g.title)}</h2><div class="yd-list">${g.rows.map((r) => ydRowHtml(r, sum)).join('')}</div></section>`).join('')}
      <section class="yd-group yd-foot" aria-labelledby="ydg-foot"><h2 class="yd-gt" id="ydg-foot">Back up, or start again</h2>
        <p class="yd-what">Export all saves your notebooks (every page of every one), highlights and notes, lists, preferences and the texts you added in one file, and Import puts them back on any computer. <b>PDFs are left out</b> because they can be large: save each one from its row above (Save a copy).</p>
        <div class="yd-footrow"><button type="button" class="btn" data-yd="export">${icon('download')}Export all</button><label class="btn" style="cursor:pointer">${icon('upload')}Import<input type="file" id="ydImport" accept="application/json" hidden></label></div>
        <p class="yd-what" id="ydUse"></p>
        <p class="yd-what">Delete everything removes every part listed above, including the PDFs and the offline copies of the Library, from this browser. Nothing is deleted from your computer’s disk.</p>
        <div class="yd-footrow"><button type="button" class="btn danger" data-yd="everything" id="dReset">${icon('trash')}Delete everything…</button></div></section>`;
    return snap;
  };
  const use = () => { if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then((e) => { const n = root.querySelector('#ydUse'); if (n && alive && e && e.quota) n.textContent = `Together this takes up about ${dataBytes(e.usage || 0)} in this browser, which would allow ${(e.quota / 1e9).toFixed(1)} GB.`; }).catch(() => {}); };
  const done = (msg, kind, undoTok) => { toast(msg + (undoTok ? ` <button type="button" class="yd-undo" data-yd-undo="${undoTok}">Undo</button>` : ''), kind || 'good', undoTok ? DATA_UNDO_MS : 3200); };
  const remove = async (id) => {
    const snap = await dataSnapshot(st); const c = dataConfirm(id, snap); const row = dataSummary(snap).groups.flatMap((g) => g.rows).find((r) => r.id === id);
    const said = id === 'prefs' ? 'Preferences reset to defaults.' : row && row.item === 'notebook' ? `Deleted ${row.only ? 'the pages of' : 'the notebook'} <b>${esc(row.label)}</b>.` : row && row.item ? `Removed <b>${esc(row.label)}</b>.` : row && row.text && row.text !== 'None' ? `${id === 'progress' || id === 'journey' ? 'Reset' : 'Removed'}: ${esc(row.text)}.` : 'Removed.';
    if (c.empty) { toast('There is nothing stored here to delete.', '', 2800); return; }
    if (!(await confirmBox(esc(c.title), ydConfirmHtml(c), c.yes, 'danger'))) return;
    ydClearUndo();
    if (id === 'everything') { try { Engine.stop(0.1); } catch (e) { /* nothing playing */ } await dataDelete(id, st); toast('Deleted — reloading'); setTimeout(() => location.reload(), 600); return; }
    let r; try { r = await dataDelete(id, st); } catch (e) { toast('It could not be removed: ' + esc((e && e.message) || ''), 'bad', 5000); return; }
    await ydAfter(id); const sn2 = await paint();
    if (r.plan.undo && r.did) { const tok = ++YD.seq; YD.undo = { tok, restore: r.restore, id }; done(said, 'good', tok); } else done(said, 'good');
    return sn2;
  };
  wire(root);
  function wire(rt) {
    const click = async (e) => {
      const b = e.target.closest && e.target.closest('[data-yd]'); if (!b || b.disabled) return; const act = b.dataset.yd; const id = b.dataset.id;
      if (act === 'del' || act === 'everything') { await remove(act === 'everything' ? 'everything' : id); return; }
      if (act === 'export') { try { await dataExportAll(); toast('Saved. Look in your downloads. PDFs are not in it.', 'good', 3600); } catch (err) { toast('The export failed: ' + esc(err.message), 'bad'); } return; }
      if (act === 'export-book') { if (typeof NB !== 'undefined') { await NB.ready(); NB.exportBook(id); toast('Saved the notebook as one file. Look in your downloads.', 'good', 3200); } return; }
      if (act === 'save-pdf') {
        try { const rec = await BOOKS_DB.get(id); if (!rec || !rec.blob) throw new Error('That PDF is no longer in this browser.'); const url = URL.createObjectURL(rec.blob); const a = document.createElement('a'); a.href = url; a.download = rec.name || 'book.pdf'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000); toast('Saved. Look in your downloads.', 'good', 2600); } catch (err) { toast(esc(err.message || 'Could not save it.'), 'bad', 4000); }
      }
    };
    rt.addEventListener('click', click); cleanups.push(() => rt.removeEventListener('click', click));
    const change = async (e) => { if (e.target.id !== 'ydImport') return; const f = e.target.files && e.target.files[0]; if (!f) return; try { await dataImportFile(f); } catch (err) { toast('Import failed: ' + esc(err.message), 'bad'); } e.target.value = ''; };
    rt.addEventListener('change', change); cleanups.push(() => rt.removeEventListener('change', change));
  }
  YD.paint = paint; paint().then(use);
  return () => { alive = false; if (YD.paint === paint) YD.paint = null; cleanups.forEach((f) => { try { f(); } catch (e) { /* gone */ } }); };
}
/* Undo, on the snackbar: the last removal's keys are put back, and the page is drawn again if it is open */
async function ydUndoNow(tok) {
  const u = YD.undo; if (!u || u.tok !== +tok) { toast('That can no longer be undone from here.', '', 3000); return; }
  YD.undo = null; try { await dataUndo(u.restore, dataRealStorage()); if (u.id === 'prefs') ydApplyPrefs(); } catch (e) { toast('It could not be put back: ' + esc((e && e.message) || ''), 'bad', 4000); return; }
  try { document.querySelectorAll('.toast .yd-undo').forEach((b) => { const t = b.closest('.toast'); if (t) t.remove(); }); } catch (e) { /* no toasts */ }
  toast('Put back.', 'good', 2400); if (ydHere()) { if (YD.paint) YD.paint(); else if (typeof Router !== 'undefined') Router.render(); }
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') document.addEventListener('click', (e) => { const b = e.target && e.target.closest && e.target.closest('[data-yd-undo]'); if (b) { e.preventDefault(); ydUndoNow(b.dataset.ydUndo); } });
