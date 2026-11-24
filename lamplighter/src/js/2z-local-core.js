/* ═══════════════════════════ 2z · The sources' own files, kept on this computer ═══════════════════════════
   Pure functions (tests/local.test.js). A folder named originals/ beside Lamplighter.html can hold the files each text was made from, exactly as its source publishes them (the PDF of the scan,
   the source's own EPUB, the plain full text), put there by tools/fetch_originals.py or copied in by hand. The tool lists what is really there in originals/index.js:
       globalThis.BEATLAB_LOCAL = Object.assign(globalThis.BEATLAB_LOCAL || {}, { "<text id>": [[file name without its extension, "<shelf>/<title [id]>/<file>", bytes], ...] })
   and the reader's "Where this text comes from" card offers those files, which open with no connection. localClean makes a damaged or hostile list show fewer files, never a wrong link. */
const LOCAL_LIMITS = { texts: 5000, files: 40, label: 140 };
const LOCAL_ID_RX = /^[a-z0-9]{1,3}-[a-z0-9-]{1,36}$/;      /* a library id is a letter, a dash and a name ("a-ada"): a word such as "constructor" is never one */
const LOCAL_KINDS = { pdf: 'PDF', epub: 'EPUB', txt: 'Full text', djvu: 'DjVu', mobi: 'Kindle', azw3: 'Kindle', html: 'Web page', htm: 'Web page' };
const localPathOk = (p) => typeof p === 'string' && p.length > 0 && p.length < 400 && !/^[\/\\]|[\\:?#]|(^|\/)\.\.?(\/|$)|[\u0000-\u001f]/.test(p) && !p.split('/').some((x) => !x);
const localUrl = (p) => 'originals/' + String(p).split('/').map(encodeURIComponent).join('/');
const localKind = (p) => { const m = /\.([A-Za-z0-9]{1,5})$/.exec(String(p)); return (m && LOCAL_KINDS[m[1].toLowerCase()]) || 'File'; };
const localSize = (n) => (n >= 1073741824 ? (n / 1073741824).toFixed(1) + ' GB' : n >= 1048576 ? Math.round(n / 1048576) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
/* the list as the page may use it: id → [{ label, path, bytes }] */
function localClean(raw) {
  const out = Object.create(null); if (!raw || typeof raw !== 'object') return out; let n = 0;
  for (const id of Object.keys(raw)) {
    if (n >= LOCAL_LIMITS.texts) break; if (!LOCAL_ID_RX.test(id) || !Array.isArray(raw[id])) continue;
    const files = []; for (const f of raw[id].slice(0, LOCAL_LIMITS.files)) {
      if (!Array.isArray(f) || !localPathOk(f[1])) continue;
      files.push({ label: String(f[0] == null ? '' : f[0]).replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, LOCAL_LIMITS.label) || String(f[1]).split('/').pop(), path: f[1], bytes: Math.max(0, Math.floor(+f[2]) || 0) });
    }
    if (files.length) { out[id] = files; n++; }
  }
  return out;
}
/* what the card shows for one text: a link for each file, with what it is and how big */
const localLinks = (files) => (files || []).map((f) => ({ url: localUrl(f.path), kind: localKind(f.path), label: f.label, size: f.bytes ? localSize(f.bytes) : '' }));
if (typeof module !== 'undefined' && module.exports) module.exports = { LOCAL_LIMITS, LOCAL_ID_RX, localPathOk, localUrl, localKind, localSize, localClean, localLinks };
