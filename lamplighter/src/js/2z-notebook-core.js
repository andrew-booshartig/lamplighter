/* ═══════════════════════════ 2z · The notebook: pages of Markdown, clips, tags and links back to the reader ═══════════════════════════
   Pure functions (tests/notebook.test.js); the store in the browser, the API (NB) and the page are in 6zn-notebook.js. Design note: NOTEBOOK.md.
   A page is a title and a Markdown body. The Markdown is small and safe: headings, bold, italic, strike, `code`, links, bullet, numbered and task lists, quotes, rules, code fences and #tags.
   Everything a person typed is escaped as it is read (no HTML is ever passed through), and a link goes only to a place in the app (#/…), to http(s): or to mailto:.
   A page is cut into blocks (a paragraph, a list, a quote, a heading, a code fence); the page shows each block as it reads and the person clicks one to edit its Markdown.
   A clip is a quote block whose last line is the citation and the link back to the exact place in the book (#/path/read/<id>?s=<section>&p=<paragraph>); the backlinks the reader shows are read from those links.
   A #tag marks the block it is written in; in a heading it marks everything under the heading; on a line of its own it marks the block above it, and at the top of a page the whole page.
   Names here begin nb or NB_ because every file of the app shares one scope (and the test harness loads this one with the rest). */
const NB_LIMITS = { pages: 2000, body: 1000000, title: 120, tag: 40, head: 80, page: 40, quote: 6000, note: 4000, inline: 20000, file: 2000000, books: 50, total: 10000, bookName: 60, bookFile: 60000000 };      /* pages: in one notebook; total: in all of them */
const NB_INBOX = 'inbox';      /* the Inbox of the first notebook (the one that was the only notebook before there were several); another notebook's Inbox is 'inbox-' and its id */
const NB_MAIN = 'main';        /* the notebook every page belongs to that has no notebook written on it: all the pages of a notebook made before there were several, and the pages of an old backup */
const NB_MAIN_NAME = 'My notebook';
const NB_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const nbEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => NB_ESC[c]);
const nbIdOk = (id) => typeof id === 'string' && /^[a-z0-9][a-z0-9_-]{0,31}$/.test(id);
const nbLibIdOk = (id) => typeof id === 'string' && /^[a-z]-[a-z0-9-]{1,60}$/.test(id);
const nbInt = (x, lo, hi, d) => { const n = typeof x === 'string' && /^\d{1,9}$/.test(x) ? +x : x; return Number.isInteger(n) && n >= lo && n <= hi ? n : d; };
const nbNl = (s) => String(s == null ? '' : s).replace(/\r\n?/g, '\n').replace(/\u0000/g, '');

/* ── ids and records ── */
/* a new id from the time and a little salt the caller draws (randHex); one already taken gets a counter */
function nbNewId(taken, now, salt) {
  const base = 'n' + Math.max(0, Math.floor(+now || 0)).toString(36) + String(salt || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
  let id = base; for (let k = 2; taken && (taken.has ? taken.has(id) : taken[id]); k++) id = base + k;
  return id;
}
const nbTitleClean = (t) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, NB_LIMITS.title);
/* a notebook has a short id of its own (a page's notebook is written on the page as `nb`); the Inbox of a notebook is the page whose id is made from it */
const nbBookIdOk = (id) => typeof id === 'string' && /^[a-z0-9][a-z0-9_-]{0,19}$/.test(id);
const nbInboxOf = (book) => (book === NB_MAIN || !nbBookIdOk(book) ? NB_INBOX : 'inbox-' + book);
const nbIsInbox = (id) => id === NB_INBOX || (typeof id === 'string' && /^inbox-[a-z0-9][a-z0-9_-]{0,19}$/.test(id));
const nbInboxBook = (id) => (id === NB_INBOX ? NB_MAIN : nbIsInbox(id) ? id.slice(6) : '');
/* whatever was saved or imported, made safe to use; null when it is not a page. A page with no valid id gets the id the caller gives (or null). A page with no notebook is in the first one ('main'), which is how a page
   made before there were several notebooks, or one from an old backup, comes into My notebook; an Inbox is always in the notebook its id names */
function nbClean(raw, now, fallbackId) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const id = nbIdOk(raw.id) ? raw.id : nbIdOk(fallbackId) ? fallbackId : null; if (!id) return null;
  const t0 = Number.isFinite(+now) ? Math.round(+now) : 0; const c = nbInt(raw.c, 0, 8.64e15, t0); const u = nbInt(raw.u, 0, 8.64e15, c);
  let body = nbNl(raw.body); if (body.length > NB_LIMITS.body) body = body.slice(0, NB_LIMITS.body);
  const inbox = nbIsInbox(id); let title = nbTitleClean(raw.title); if (inbox && !title) title = 'Inbox';
  const nb = inbox ? nbInboxBook(id) : nbBookIdOk(raw.nb) ? raw.nb : NB_MAIN;
  return { id, title, body, c, u, nb };
}
/* a list of pages made safe: junk and repeated ids dropped, the first of an id kept, at most NB_LIMITS.total, and at most NB_LIMITS.pages in any one notebook */
function nbCleanList(list, now) {
  const out = []; const seen = new Set(); const per = new Map();
  (Array.isArray(list) ? list : []).forEach((r) => { if (out.length >= NB_LIMITS.total) return; const rec = nbClean(r, now); if (!rec || seen.has(rec.id)) return; const n = per.get(rec.nb) || 0; if (n >= NB_LIMITS.pages) return; per.set(rec.nb, n + 1); seen.add(rec.id); out.push(rec); });
  return out;
}
const nbTitleOf = (rec) => (rec && rec.title) || (rec && nbIsInbox(rec.id) ? 'Inbox' : 'Untitled');

/* ── a page as a file: front matter, then the Markdown ── */
const nbIso = (ms) => { try { return new Date(ms).toISOString(); } catch (e) { return ''; } };
function nbYamlOut(s) { s = String(s); return s === '' || /^[\s\-?:,\[\]{}#&*!|>'"%@`]|[\s:]$|: | #|["\\\n\r\t]/.test(s) ? JSON.stringify(s) : s; }
function nbYamlIn(v) {
  v = String(v).trim();
  if (v[0] === '"' && v.length > 1 && v[v.length - 1] === '"') { try { return String(JSON.parse(v)); } catch (e) { return v.slice(1, -1); } }
  if (v[0] === "'" && v.length > 1 && v[v.length - 1] === "'") return v.slice(1, -1).replace(/''/g, "'");
  return v;
}
function nbToMd(rec) {
  const r = nbClean(rec, Date.now(), 'x') || { id: 'x', title: '', body: '', c: 0, u: 0 };
  const head = ['---', 'title: ' + nbYamlOut(r.title), 'id: ' + r.id, 'created: ' + nbIso(r.c), 'updated: ' + nbIso(r.u), '---'].join('\n');
  const body = r.body.replace(/\s+$/, '');
  return head + '\n\n' + (body ? body + '\n' : '');
}
/* front matter, if the text begins with a block of "key: value" lines between two --- lines (anything else that starts with --- is just a page) */
function nbSplitFront(text) {
  const t = nbNl(text).replace(/^\ufeff/, ''); if (!/^---[ \t]*\n/.test(t)) return { meta: {}, body: t };
  const lines = t.split('\n'); let end = -1;
  for (let i = 1; i < lines.length && i <= 60; i++) if (/^(---|\.\.\.)[ \t]*$/.test(lines[i])) { end = i; break; }
  if (end < 1) return { meta: {}, body: t };
  const meta = Object.create(null); let keys = 0;
  for (let i = 1; i < end; i++) {
    const ln = lines[i]; if (!ln.trim()) continue;
    const m = ln.match(/^([A-Za-z_][\w-]{0,30}):[ \t]*(.*)$/);
    if (m) { meta[m[1].toLowerCase()] = nbYamlIn(m[2]); keys++; } else if (!/^([ \t]+\S|-[ \t]|#)/.test(ln)) return { meta: {}, body: t };
  }
  if (!keys) return { meta: {}, body: t };
  return { meta, body: lines.slice(end + 1).join('\n').replace(/^\n+/, '') };
}
/* a page from a file's text: its front matter, else its first "# heading", else the file name, gives the title; an id is kept only if it is a good one */
function nbFromMd(text, fileName, now) {
  const { meta, body } = nbSplitFront(text); let title = nbTitleClean(meta.title); let b = body; const keyed = 'title' in meta;
  if (!keyed) { const m = b.match(/^(?:[ \t]*\n)*[ \t]{0,3}#[ \t]+(.+?)[ \t]*#*[ \t]*(?:\n|$)/); if (m) { title = nbTitleClean(m[1]); b = b.slice(m[0].length).replace(/^\n+/, ''); } }
  if (!keyed && !title && fileName) title = nbTitleClean(String(fileName).split(/[\\/]/).pop().replace(/\.(md|markdown|txt)$/i, '').replace(/[_]+/g, ' '));
  const t0 = Number.isFinite(+now) ? Math.round(+now) : 0; const cd = Date.parse(meta.created); const ud = Date.parse(meta.updated);
  const c = Number.isFinite(cd) && cd >= 0 ? cd : t0; const u = Number.isFinite(ud) && ud >= 0 ? ud : c;
  return { id: nbIdOk(meta.id) ? meta.id : '', title, body: nbNl(b).replace(/\s+$/, '').slice(0, NB_LIMITS.body), c, u };
}
/* a name for the file of a page: the title with what a file name cannot hold taken out, and different from the names already used */
function nbFileName(title, taken, ext) {
  let n = String(title || '').replace(/[\u0000-\u001f\u007f\/\\:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^\.+/, '').replace(/[. ]+$/, '').slice(0, 80).trim() || 'Untitled';
  const e = '.' + (ext || 'md'); let name = n + e; for (let k = 2; taken && taken.has(name.toLowerCase()); k++) name = n + ' ' + k + e;
  if (taken) taken.add(name.toLowerCase()); return name;
}
/* what to do with pages brought in from files: never replace one that is here. Identical ones (in the notebook they come into) are skipped; a new one keeps its id if it is free (in any notebook), else gets a fresh one and
   "(imported)" after its title. An Inbox is never brought in under its own id: it comes in as a page called Inbox (imported) when that name is already used, so it cannot land in another notebook's Inbox.
   existing: the pages of the notebook they come into; allIds: the ids of every page in every notebook (default: the ids of `existing`) */
function nbPlanImport(existing, incoming, now, salt, allIds) {
  const have = Array.isArray(existing) ? existing : []; const taken = new Set(allIds ? [...allIds] : []); have.forEach((r) => taken.add(r.id)); const same = new Set(have.map((r) => r.title + '\u0000' + r.body.trim()));
  const add = []; let skipped = 0; let renamed = 0; let n = have.length;
  (Array.isArray(incoming) ? incoming : []).forEach((r0, k) => {
    const r = r0 && typeof r0 === 'object' ? r0 : null; if (!r) return; const body = nbNl(r.body); const title = nbTitleClean(r.title);
    if (!body.trim() && !title) return; if (same.has(title + '\u0000' + body.trim())) { skipped++; return; } if (n >= NB_LIMITS.pages) return;
    const own = nbIdOk(r.id) && !nbIsInbox(r.id); let id = own && !taken.has(r.id) ? r.id : '';
    let t = title; if (!id) { id = nbNewId(taken, now + k, salt); if (nbIdOk(r.id) && (taken.has(r.id) || nbIsInbox(r.id))) { t = (title || 'Untitled') + ' (imported)'; renamed++; } }
    const rec = nbClean({ id, title: t, body, c: r.c, u: r.u }, now); if (!rec) return; taken.add(id); same.add(rec.title + '\u0000' + rec.body.trim()); add.push(rec); n++;
  });
  return { add, skipped, renamed };
}

/* ── links ── */
/* a link goes to a place in the app (#/…), a web page or an address to mail; anything else (javascript:, data:, file:, a relative path) is not a link. Tabs and line ends inside an address are dropped, as a browser does; any other space or control character makes it no address */
const nbBadChar = (c) => c <= 32 || (c >= 127 && c <= 159) || (c >= 0x200b && c <= 0x200f) || c === 0x2028 || c === 0x2029 || c === 0xfeff;
function nbSafeHref(h) {
  const u = String(h == null ? '' : h).replace(/[\t\n\r]/g, '').replace(/^ +| +$/g, ''); if (!u || u.length > 2000) return null;
  for (let i = 0; i < u.length; i++) if (nbBadChar(u.charCodeAt(i))) return null;
  return /^#\/[^"<>]*$/.test(u) || /^https?:\/\/[^"<>]+$/i.test(u) || /^mailto:[^"<>]+$/i.test(u) ? u : null;
}
/* the reader's address for a place in a book */
function nbReadHref(id, s, p) { return '#/path/read/' + id + '?s=' + nbInt(s, 0, 1e5, 0) + (nbInt(p, 0, 1e5, -1) >= 0 ? '&p=' + nbInt(p, 0, 1e5, 0) : ''); }
/* the place a reader address names, or null for any other address */
function nbReadPlace(href) {
  const m = String(href || '').match(/^#\/path\/read\/([a-z]-[a-z0-9-]{1,60})(?:\?([^#\s]*))?$/); if (!m) return null;
  const q = {}; String(m[2] || '').split('&').forEach((kv) => { const e = kv.indexOf('='); if (e > 0) q[kv.slice(0, e)] = kv.slice(e + 1); });
  return { id: m[1], s: nbInt(q.s, 0, 1e5, 0), p: nbInt(q.p, 0, 1e5, -1) };
}

/* ── inline Markdown: a list of tokens (text, code, link, strong, em, del, tag), then HTML or tags from them ── */
const NB_NEXT = /[\\`*_~\[#]|https?:\/\//gi;
const NB_PUNCT = /[!-\/:-@\[-`{-~]/;
const NB_WORDCH = /[\p{L}\p{N}]/u;
const NB_WIN = 4000;
function nbLink(s, i) {
  let depth = 0; let j = i; const lim = Math.min(s.length, i + NB_WIN);
  for (; j < lim; j++) { const c = s[j]; if (c === '\\') { j++; continue; } if (c === '[') depth++; else if (c === ']') { depth--; if (depth === 0) break; } }
  if (j >= lim || s[j] !== ']' || s[j + 1] !== '(') return null;
  let k = j + 2; let pd = 0; const lim2 = Math.min(s.length, k + NB_WIN);
  for (; k < lim2; k++) { const c = s[k]; if (c === '\\') { k++; continue; } if (c === '\n') return null; if (c === '(') pd++; else if (c === ')') { if (pd === 0) break; pd--; } }
  if (k >= lim2 || s[k] !== ')') return null;
  const um = s.slice(j + 2, k).match(/^\s*(<[^<>]*>|[^\s]*)(?:\s+(?:"[^"]*"|'[^']*'))?\s*$/); if (!um) return null;
  const href = um[1][0] === '<' ? um[1].slice(1, -1) : um[1];
  return { end: k + 1, label: s.slice(i + 1, j), href };
}
function nbClose(s, from, d, r) {
  const lim = Math.min(s.length, from + NB_WIN); let pos = from;
  for (;;) {
    pos = s.indexOf(d, pos); if (pos < 0 || pos >= lim) return -1;
    if (s[pos - 1] === '\\') { pos += 1; continue; }
    if (r === 1 && s[pos + 1] === d[0]) { pos += 2; continue; }
    if (r === 1 && s[pos - 1] === d[0]) { pos += 1; continue; }
    if (pos > from && !/\s/.test(s[pos - 1])) { if (d[0] !== '_' || !NB_WORDCH.test(s[pos + d.length] || ' ')) return pos; }
    pos += d.length;
  }
}
function nbInlineTokens(src, o, depth) {
  o = o || {}; depth = depth || 0; const s = String(src); const out = []; let text = ''; let i = 0; const n = s.length;
  const flush = () => { if (text) { out.push({ t: 'text', v: text }); text = ''; } };
  while (i < n) {
    NB_NEXT.lastIndex = i; const m = NB_NEXT.exec(s); const j = m ? m.index : n; if (j > i) { text += s.slice(i, j); i = j; } if (i >= n) break;
    const ch = s[i]; const prev = i > 0 ? s[i - 1] : '';
    if (ch === '\\') { if (i + 1 < n && NB_PUNCT.test(s[i + 1])) { text += s[i + 1]; i += 2; } else { text += '\\'; i++; } continue; }
    if (ch === '`') {
      let k = i; while (s[k] === '`') k++; const run = k - i; const fence = '`'.repeat(run); let pos = k; let found = -1;
      while (pos < n) { const idx = s.indexOf(fence, pos); if (idx < 0) break; if (s[idx - 1] !== '`' && s[idx + run] !== '`') { found = idx; break; } pos = idx + 1; }
      if (found < 0) { text += fence; i = k; continue; }
      let code = s.slice(k, found); if (code.length > 2 && code[0] === ' ' && code[code.length - 1] === ' ') code = code.slice(1, -1);
      flush(); out.push({ t: 'code', v: code }); i = found + run; continue;
    }
    if (ch === '[') {
      const L = o.noLinks || depth > 6 ? null : nbLink(s, i);
      if (L) { const href = nbSafeHref(L.href); const kids = nbInlineTokens(L.label, { noLinks: true, noTags: true }, depth + 1); flush(); if (href) out.push({ t: 'link', href, kids }); else kids.forEach((x) => out.push(x)); i = L.end; continue; }
      text += '['; i++; continue;
    }
    if (ch === '*' || ch === '_' || ch === '~') {
      let k = i; while (s[k] === ch) k++; const run = k - i; const next = s[k] || ' ';
      const ok = depth < 6 && !/\s/.test(next) && (ch === '~' ? run === 2 : run <= 3) && (ch !== '_' || !NB_WORDCH.test(prev || ' '));
      const d = ch.repeat(run); const e = ok ? nbClose(s, k, d, run) : -1;
      if (e > 0) { const kids = nbInlineTokens(s.slice(k, e), o, depth + 1); flush(); const tk = ch === '~' ? { t: 'del', kids } : run === 1 ? { t: 'em', kids } : run === 2 ? { t: 'strong', kids } : { t: 'strong', kids: [{ t: 'em', kids }] }; out.push(tk); i = e + run; continue; }
      text += d; i = k; continue;
    }
    if (ch === '#') {
      if (!o.noTags && (i === 0 || /[\s(\[{"'“‘—–>]/.test(prev))) {
        const tm = s.slice(i, i + NB_LIMITS.tag + 2).match(/^#(\p{L}[\p{L}\p{N}_-]*)/u);
        if (tm) { let raw = tm[1].slice(0, NB_LIMITS.tag).replace(/[-_]+$/, ''); if (raw) { flush(); out.push({ t: 'tag', tag: raw.toLowerCase(), raw }); i += 1 + raw.length; continue; } }
      }
      text += '#'; i++; continue;
    }
    /* http:// or https://: a bare address becomes a link, when it begins a word */
    if (!o.noLinks && (i === 0 || !NB_WORDCH.test(prev))) {
      const um = s.slice(i, i + 2100).match(/^https?:\/\/[^\s<>"]+/i);
      if (um) {
        let u = um[0]; for (;;) { const last = u[u.length - 1]; if (/[.,;:!?'"]/.test(last)) u = u.slice(0, -1); else if (last === ')' && u.split(')').length > u.split('(').length) u = u.slice(0, -1); else if (last === ']' && u.split(']').length > u.split('[').length) u = u.slice(0, -1); else break; }
        const href = nbSafeHref(u); if (href && u.length > 8) { flush(); out.push({ t: 'link', href, kids: [{ t: 'text', v: u }], bare: true }); i += u.length; continue; }
      }
    }
    text += ch; i++;
  }
  flush(); return out;
}
function nbTokensHtml(tokens) {
  return tokens.map((k) => {
    if (k.t === 'text') return nbEsc(k.v);
    if (k.t === 'code') return '<code>' + nbEsc(k.v) + '</code>';
    if (k.t === 'strong') return '<strong>' + nbTokensHtml(k.kids) + '</strong>';
    if (k.t === 'em') return '<em>' + nbTokensHtml(k.kids) + '</em>';
    if (k.t === 'del') return '<del>' + nbTokensHtml(k.kids) + '</del>';
    if (k.t === 'tag') return '<a class="nbk-tag" href="#/notebook/tag/' + encodeURIComponent(k.tag) + '">#' + nbEsc(k.raw) + '</a>';
    if (k.t === 'link') { const inner = nbTokensHtml(k.kids); return k.href[0] === '#' ? '<a href="' + nbEsc(k.href) + '"' + (nbReadPlace(k.href) ? ' class="nbk-ref"' : '') + '>' + inner + '</a>' : '<a href="' + nbEsc(k.href) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>'; }
    return '';
  }).join('');
}
const nbInlineHtml = (src, o) => nbTokensHtml(nbInlineTokens(src, o)).replace(/\n/g, '<br>');
function nbTokensWalk(tokens, fn) { tokens.forEach((k) => { fn(k); if (k.kids) nbTokensWalk(k.kids, fn); }); }
const nbTokensText = (tokens, noTags) => tokens.map((k) => (k.t === 'text' || k.t === 'code' ? k.v : k.t === 'tag' ? (noTags ? '' : '#' + k.raw) : k.kids ? nbTokensText(k.kids, noTags) : '')).join('');
const nbPlain = (src, noTags) => nbTokensText(nbInlineTokens(src), noTags).replace(/\s+/g, ' ').trim();

/* ── blocks ── */
const NB_RE = {
  fence: /^ {0,3}(`{3,}|~{3,})/, heading: /^ {0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/, headingEmpty: /^ {0,3}#{1,6}[ \t]*$/, rule: /^ {0,3}([-*_])([ \t]*\1){2,}[ \t]*$/,
  quote: /^ {0,3}>/, marker: /^([ \t]*)([-*+]|\d{1,9}[.)])(?:[ \t]+(.*))?$/, top: /^ {0,3}([-*+]|\d{1,9}[.)])(?:[ \t]+\S|[ \t]*$)/,
};
function nbLineKind(line, prev) {
  if (NB_RE.quote.test(line)) return 'quote';
  if (NB_RE.top.test(line) || (prev === 'list' && (NB_RE.marker.test(line) || /^(?:[ \t]{2,}|\t)\S/.test(line)))) return 'list';
  return 'text';
}
/* a page's body cut into blocks (strings). Blank lines end a block, a heading or a rule is a block of its own, a fence runs to its closing fence, and a quote, a list and a paragraph that follow each other are three blocks */
function nbBlocks(body) {
  const lines = nbNl(body).split('\n'); const out = []; let cur = []; let kind = ''; let fence = null;
  const flush = () => { if (cur.length) out.push(cur.join('\n').replace(/\s+$/, '')); cur = []; kind = ''; };
  for (const line of lines) {
    if (fence) { cur.push(line); const c = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/); if (c && c[1][0] === fence.ch && c[1].length >= fence.n) { fence = null; flush(); } continue; }
    const f = line.match(NB_RE.fence); if (f) { flush(); fence = { ch: f[1][0], n: f[1].length }; cur.push(line); continue; }
    if (!line.trim()) { flush(); continue; }
    if (NB_RE.heading.test(line) || NB_RE.headingEmpty.test(line) || NB_RE.rule.test(line)) { flush(); out.push(line.trim()); continue; }
    const k = nbLineKind(line, kind); if (cur.length && k !== kind) flush(); kind = k; cur.push(line);
  }
  flush(); return out;
}
const nbJoin = (blocks) => blocks.map((b) => String(b).replace(/\s+$/, '')).filter((b) => b.trim()).join('\n\n');
function nbBlockKind(text) {
  const first = String(text).split('\n', 1)[0];
  if (NB_RE.fence.test(first)) return 'code';
  if (NB_RE.heading.test(first) || NB_RE.headingEmpty.test(first)) return 'heading';
  if (NB_RE.rule.test(first) && !String(text).includes('\n')) return 'rule';
  if (NB_RE.quote.test(first)) return 'quote';
  if (NB_RE.top.test(first)) return 'list';
  return String(text).trim() ? 'para' : 'empty';
}
const nbHeadingLevel = (text) => { const m = String(text).match(/^ {0,3}(#{1,6})/); return m ? m[1].length : 0; };
const nbHeadingText = (text) => { const m = String(text).match(NB_RE.heading); return m ? m[2] : ''; };
/* the text of a block with its quote marks, list markers and heading marks taken off: what a person wrote, for finding tags and words */
function nbBlockSource(text) {
  const kind = nbBlockKind(text); const lines = String(text).split('\n');
  if (kind === 'code' || kind === 'rule' || kind === 'empty') return '';
  if (kind === 'heading') return nbHeadingText(lines[0]);
  if (kind === 'quote') return lines.map((l) => l.replace(/^ {0,3}>[ ]?/, '')).join('\n');
  if (kind === 'list') return lines.map((l) => l.replace(/^[ \t]*(?:[-*+]|\d{1,9}[.)])(?:[ \t]+(?:\[[ xX]\](?:[ \t]+|$))?|$)/, '')).join('\n');
  return lines.join('\n');
}
function nbBlockTags(text) {
  const src = nbBlockSource(text); if (!src || src.length > NB_LIMITS.inline) return []; const seen = [];
  nbTokensWalk(nbInlineTokens(src), (k) => { if (k.t === 'tag' && !seen.includes(k.tag)) seen.push(k.tag); }); return seen;
}
function nbTagsOnly(text) {
  if (nbBlockKind(text) !== 'para') return false; const toks = nbInlineTokens(text); let tags = 0;
  for (const k of toks) { if (k.t === 'tag') tags++; else if (k.t !== 'text' || /\S/.test(k.v)) return false; }
  return tags > 0;
}
/* ── a block as HTML ── */
function nbListHtml(text, o) {
  const items = []; let lastItem = null;
  String(text).split('\n').forEach((ln, idx) => {
    const m = ln.match(NB_RE.marker);
    if (m) { const ind = m[1].replace(/\t/g, '    ').length; const mk = m[2]; let t = m[3] || ''; let task = null; const tm = t.match(/^\[([ xX])\](?:[ \t]+(.*))?$/); if (tm) { task = tm[1] !== ' '; t = tm[2] || ''; } lastItem = { ind, ordered: /\d/.test(mk), n: parseInt(mk, 10), text: t, task, line: idx, kids: [] }; items.push(lastItem); }
    else if (lastItem) lastItem.text += '\n' + ln.trim();
  });
  const root = { ind: -1, kids: [] }; const stack = [root];
  items.forEach((it) => { while (stack.length > 1 && stack[stack.length - 1].ind >= it.ind) stack.pop(); stack[stack.length - 1].kids.push(it); stack.push(it); });
  const render = (kids) => {
    let html = ''; let i = 0;
    while (i < kids.length) {
      const ordered = kids[i].ordered; let j = i; let lis = '';
      while (j < kids.length && kids[j].ordered === ordered) {
        const it = kids[j]; const box = it.task === null ? '' : '<input type="checkbox" class="nbk-chk" data-line="' + it.line + '"' + (it.task ? ' checked' : '') + (o && o.readonly ? ' disabled' : '') + ' aria-label="Done"> ';
        lis += '<li' + (it.task === null ? '' : ' class="nbk-task' + (it.task ? ' done' : '') + '"') + '>' + box + nbInlineHtml(it.text) + (it.kids.length ? render(it.kids) : '') + '</li>'; j++;
      }
      const tag = ordered ? 'ol' : 'ul'; html += '<' + tag + (ordered && kids[i].n > 1 ? ' start="' + Math.min(kids[i].n, 999999999) + '"' : '') + '>' + lis + '</' + tag + '>'; i = j;
    }
    return html;
  };
  return render(root.kids);
}
function nbQuoteHtml(text) {
  const inner = String(text).split('\n').map((l) => l.replace(/^ {0,3}>[ ]?/, '')); const paras = []; let cur = [];
  inner.forEach((l) => { if (!l.trim()) { if (cur.length) paras.push(cur.join('\n')); cur = []; } else cur.push(l); }); if (cur.length) paras.push(cur.join('\n'));
  return '<blockquote class="nbk-quote">' + paras.map((p, k) => '<p' + (k === paras.length - 1 && k > 0 && /^(?:—|–|--)[ \t]?\S/.test(p) ? ' class="nbk-cite"' : '') + '>' + nbInlineHtml(p) + '</p>').join('') + '</blockquote>';
}
/* one block as HTML that is safe to put on the page. o.readonly: boxes of tasks cannot be ticked */
function nbBlockHtml(text, o) {
  const t = nbNl(text); const kind = nbBlockKind(t);
  try {
    if (kind === 'empty') return '';
    if (kind === 'rule') return '<hr class="nbk-rule">';
    if (kind === 'code') { const lines = t.split('\n'); lines.shift(); if (lines.length && /^ {0,3}(`{3,}|~{3,})[ \t]*$/.test(lines[lines.length - 1])) lines.pop(); return '<pre class="nbk-code"><code>' + nbEsc(lines.join('\n')) + '</code></pre>'; }
    if (kind === 'heading') { const lvl = Math.min(nbHeadingLevel(t), 3); return '<h' + (lvl + 1) + ' class="nbk-h' + lvl + '">' + nbInlineHtml(nbHeadingText(t.split('\n')[0])) + '</h' + (lvl + 1) + '>'; }
    if (t.length > NB_LIMITS.inline) return '<p>' + nbEsc(t).replace(/\n/g, '<br>') + '</p>';
    if (kind === 'quote') return nbQuoteHtml(t);
    if (kind === 'list') return nbListHtml(t, o);
    return '<p>' + nbInlineHtml(t) + '</p>';
  } catch (e) { return '<p>' + nbEsc(t).replace(/\n/g, '<br>') + '</p>'; }
}
const nbHtml = (body, o) => nbBlocks(body).map((b) => nbBlockHtml(b, o)).join('');
/* ticking a task: the box on that line of a list block turned over (null when that line is not a task) */
function nbToggleTask(text, line) {
  const lines = nbNl(text).split('\n'); const ln = lines[line]; if (typeof ln !== 'string') return null; const m = ln.match(/^([ \t]*(?:[-*+]|\d{1,9}[.)])[ \t]+)\[([ xX])\]([ \t].*|)$/); if (!m) return null;
  lines[line] = m[1] + '[' + (m[2] === ' ' ? 'x' : ' ') + ']' + m[3]; return lines.join('\n');
}

/* ── tags: what each block carries ── */
/* every block of a page with the tags it carries. own: written in it; eff: its own and those it is under (a heading's, the page's, a tag line below it). item: a clip or a note that a tag page lists.
   A tag line is a block of nothing but tags: below a block it tags that block (below a heading, the whole section), and at the very top of the page it tags the page. It is not itself listed. */
function nbAnalyse(body) {
  const info = nbBlocks(body).map((text, i) => ({ i, text, kind: nbBlockKind(text), own: nbBlockTags(text), eff: [], heading: '', item: false, tagLine: nbTagsOnly(text) }));
  const pageTags = info.length && info[0].tagLine ? info[0].own.slice() : [];
  const below = info.map(() => []); info.forEach((b, i) => { if (b.tagLine && i > 0) b.own.forEach((t) => below[i - 1].push(t)); });
  const stack = [];
  info.forEach((b, i) => {
    if (b.kind === 'heading') { const lvl = nbHeadingLevel(b.text); while (stack.length && stack[stack.length - 1].level >= lvl) stack.pop(); stack.push({ level: lvl, tags: b.own.concat(below[i]), text: nbPlain(nbHeadingText(b.text), true) }); }
    const set = new Set(); if (!b.tagLine) b.own.forEach((t) => set.add(t)); below[i].forEach((t) => set.add(t)); pageTags.forEach((t) => set.add(t)); stack.forEach((sc) => sc.tags.forEach((t) => set.add(t)));
    b.eff = [...set]; b.heading = b.kind !== 'heading' && stack.length ? stack[stack.length - 1].text : '';
    b.item = !b.tagLine && b.kind !== 'heading' && b.kind !== 'rule' && b.kind !== 'empty';
  });
  return { blocks: info, pageTags };
}
/* the tags of all the pages with how many clips and notes carry each, most used first; and where each is */
function nbIndex(pages, anOf) {
  const by = new Map();
  (Array.isArray(pages) ? pages : []).forEach((pg) => {
    const an = anOf ? anOf(pg) : nbAnalyse(pg.body); const here = new Map();
    an.blocks.forEach((b) => { if (!b.item) return; b.eff.forEach((t) => { if (!here.has(t)) here.set(t, []); here.get(t).push({ i: b.i, text: b.text, kind: b.kind, heading: b.heading }); }); });
    here.forEach((items, t) => { if (!by.has(t)) by.set(t, []); by.get(t).push({ page: pg, items }); });
  });
  const tags = [...by.entries()].map(([tag, groups]) => ({ tag, count: groups.reduce((a, g) => a + g.items.length, 0), pages: groups.length })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  return { tags, by };
}

/* ── places in books that a page links to (the backlinks the reader shows) ── */
function nbRefs(body) {
  const out = [];
  nbBlocks(body).forEach((text, i) => {
    const src = nbBlockSource(text); if (!src || src.length > NB_LIMITS.inline) return;
    nbTokensWalk(nbInlineTokens(src), (k) => { if (k.t === 'link') { const pl = nbReadPlace(k.href); if (pl) out.push({ id: pl.id, s: pl.s, p: pl.p, block: i, href: k.href, quote: nbQuoteOf(text) }); } });
  });
  return out;
}
/* the words of a quote block without its citation, for showing in a list */
function nbQuoteOf(text) {
  const kind = nbBlockKind(text); const src = nbBlockSource(text); if (kind !== 'quote') return nbPlain(src).slice(0, 200);
  const paras = src.split(/\n\s*\n/); if (paras.length > 1 && /^(?:—|–|--)[ \t]?\S/.test(paras[paras.length - 1])) paras.pop();
  const q = nbPlain(paras.join(' ')); return q.length > 200 ? q.slice(0, 199) + '…' : q;
}
/* the pages that link to a place: id of the text, and optionally the section and the paragraph. A link to a whole section matches a question about any paragraph in it only when the question names no paragraph */
function nbBacklinks(pages, id, s, p, refsOf) {
  const out = []; if (!nbLibIdOk(id)) return out;
  (Array.isArray(pages) ? pages : []).forEach((pg) => {
    (refsOf ? refsOf(pg) : nbRefs(pg.body)).forEach((r) => { if (r.id !== id) return; if (s != null && r.s !== s) return; if (p != null && r.p !== p) return; out.push({ pageId: pg.id, title: nbTitleOf(pg), block: r.block, s: r.s, p: r.p, quote: r.quote, href: '#/notebook/' + pg.id + '?b=' + r.block }); });
  });
  return out;
}

/* ── clips ── */
/* a line of a quotation as Markdown that reads as plain words: what would be taken for Markdown is escaped */
function nbEscMd(line) {
  let s = String(line).replace(/[\\*_`\[\]<~]/g, '\\$&'); s = s.replace(/(^|\s)#(?=\p{L})/gu, '$1\\#');
  return s.replace(/^(\s*)(#{1,6}(?=\s)|[-+*](?=\s)|>)/, '$1\\$2').replace(/^(\s*)(\d{1,9})([.)])(?=\s)/, '$1$2\\$3');
}
const nbOneLine = (s, n) => { const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).trim() + '…' : t; };
function nbCut(text, max) {
  if (text.length <= max) return text; const cut = text.slice(0, max); const at = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\n'), cut.lastIndexOf(' ')); return cut.slice(0, at > max * 0.6 ? at : max).replace(/[\s,;:]+$/, '') + '…';
}
/* the Markdown of a clip: the quotation as a quote block and, as its last line, the citation that is also the link back to the place. c: { id, text, s, p, heading, page, title, note }. null when there is nothing to clip */
function nbClipMd(c) {
  if (!c || !nbLibIdOk(c.id)) return null; const raw = nbNl(c.text).replace(/[\u00a0\t]+/g, ' ').split('\n').map((l) => l.replace(/ {2,}/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim(); if (!raw) return null;
  const quote = nbCut(raw, NB_LIMITS.quote); const lines = quote.split('\n').map((l) => (l ? '> ' + nbEscMd(l) : '>'));
  const title = nbOneLine(c.title || c.id, 100); const head = nbOneLine(c.heading, NB_LIMITS.head); const page = nbOneLine(c.page, NB_LIMITS.page);
  const lab = '*' + nbEscMd(title) + '*' + (head && head.toLowerCase() !== title.toLowerCase() ? ', ' + nbEscMd(head) : '') + (page ? ', ' + nbEscMd(page) : '');
  const note = nbNl(c.note).trim().slice(0, NB_LIMITS.note);
  return lines.join('\n') + '\n>\n> — [' + lab + '](' + nbReadHref(c.id, c.s, c.p) + ')' + (note ? '\n\n' + note : '');
}
/* whether a page already holds a clip of these words from this place */
function nbHasClip(body, c) {
  const md = nbClipMd(c); if (!md) return false; const want = nbQuoteOf(nbBlocks(md)[0]); const s = nbInt(c.s, 0, 1e5, 0); const p = nbInt(c.p, 0, 1e5, -1);
  return nbRefs(body).some((r) => r.id === c.id && r.s === s && r.p === p && r.quote === want);
}
/* a page's body with some Markdown added at the end (a blank line between blocks) */
const nbAppend = (body, md) => nbJoin([...nbBlocks(body), ...nbBlocks(md)]);

/* ── templates and the question ── */
const NB_TEMPLATES = [
  { id: 'blank', name: 'Blank', blurb: 'A clean page to write on', title: 'Untitled', body: '' },
  { id: 'study', name: 'Study notes', blurb: 'What I read, key ideas, passages, questions, and a summary in my own words', title: 'Study notes',
    body: '*{{date}}*\n\n## What I read\n\n-\n\n## Key ideas\n\n-\n\n## Passages\n\n*Select words in a text and choose Clip to bring a passage here.*\n\n## Questions\n\n-\n\n## In my own words\n\n' },
  { id: 'compare', name: 'Compare themes', blurb: 'One question, passages from each tradition, where they rhyme and where they part', title: 'Comparing themes',
    body: '*{{date}}*\n\n## The question\n\nWhat do I want to compare, and why?\n\n## Passages\n\n### First tradition or text\n\n### Second tradition or text\n\n## Where they rhyme\n\n-\n\n## Where they part\n\n-\n\n## What I would check next\n\n-\n\n' },
  { id: 'log', name: 'Reading log', blurb: 'A dated entry: the text, how far I read, what I noticed, a question', title: 'Reading log',
    body: '## {{date}}\n\n**Text:**\n**Read:**\n**Noticed:**\n**A question:**\n' },
];
const NB_TEMPLATE_BY_ID = Object.fromEntries(NB_TEMPLATES.map((t) => [t.id, t]));
function nbTemplate(id, dateLabel) {
  const t = NB_TEMPLATE_BY_ID[id] || NB_TEMPLATES[0]; const fill = (s) => s.replace(/\{\{\s*title\s*\}\}/g, t.title).replace(/\{\{\s*date\s*\}\}/g, dateLabel || '');
  return { title: fill(t.title), body: nbJoin(nbBlocks(fill(t.body))) };
}
/* plain questions to think with: they ask, they do not answer */
const NB_QUESTIONS = [
  'Which line or image stayed with me, and why?', 'What does this text take for granted that I would want to check?', 'What do I know from the text itself, and what only from what others say about it?',
  'Where do two traditions say something alike here, and where do they part?', 'How would someone who holds this text sacred read this passage? How would someone who does not?', 'What word here would I like to understand better?',
  'What is the oldest source I can find for this?', 'What has changed in how I see this since I began?', 'What would I want to ask the person who wrote this?', 'What do I keep from this week? What do I doubt?',
  'What would I tell a friend about what I read today?', 'What did I expect to find, and what did I find?', 'What question is the text answering?', 'What is one thing I could look up today?',
];
/* the question for a day: the current station's own questions come first when the Journey has them, else the plain ones, by the day */
function nbQuestion(day, stationQs) {
  const own = (Array.isArray(stationQs) ? stationQs : []).filter((q) => typeof q === 'string' && q.trim()); const pool = own.length ? own : NB_QUESTIONS; const d = nbInt(day, 0, 1e9, 0);
  return pool[d % pool.length].trim();
}
const nbQuestionMd = (q) => '**Today’s question:** ' + String(q).trim();

/* ── finding a page ── */
const nbFold = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function nbSearch(pages, query) {
  const words = nbFold(query).split(/\s+/).filter(Boolean).slice(0, 8); const list = Array.isArray(pages) ? pages : []; if (!words.length) return list.slice();
  const hits = []; list.forEach((pg) => { const t = nbFold(nbTitleOf(pg)); const all = t + '\n' + nbFold(pg.body); if (words.every((w) => all.includes(w))) hits.push({ pg, title: words.every((w) => t.includes(w)) }); });
  return hits.sort((a, b) => (a.title === b.title ? (b.pg.u || 0) - (a.pg.u || 0) : a.title ? -1 : 1)).map((h) => h.pg);
}
/* the list on the left: the Inbox first, then the most recently written */
const nbOrder = (pages) => (Array.isArray(pages) ? pages.slice() : []).sort((a, b) => (nbIsInbox(a.id) !== nbIsInbox(b.id) ? (nbIsInbox(a.id) ? -1 : 1) : (b.u || 0) - (a.u || 0) || (a.c || 0) - (b.c || 0)));
const nbClipCount = (body) => nbRefs(body).length;

/* ── notebooks: the list, a notebook's name, and what belongs to which ── */
const nbBookName = (t) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, NB_LIMITS.bookName);
/* a new notebook's id: 'k', the time and a little salt (like a page's, and never one already used) */
function nbBookNew(taken, now, salt) {
  const base = 'k' + Math.max(0, Math.floor(+now || 0)).toString(36) + String(salt || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4); let id = base.slice(0, 18);
  for (let k = 2; taken && (taken.has ? taken.has(id) : taken[id]); k++) id = base.slice(0, 16) + k;
  return id;
}
/* a name no notebook has (ignoring case): the name as it is, or with 2, 3, … after it; exceptId: the notebook being renamed */
function nbBookNameUnique(name, books, exceptId) {
  const n = nbBookName(name) || 'Notebook'; const used = new Set((Array.isArray(books) ? books : []).filter((b) => b && b.id !== exceptId).map((b) => String(b.name).toLowerCase())); let out = n;
  for (let k = 2; used.has(out.toLowerCase()); k++) { const tail = ' ' + k; out = n.slice(0, NB_LIMITS.bookName - tail.length).trim() + tail; }
  return out;
}
function nbBookClean(raw, now) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !nbBookIdOk(raw.id)) return null;
  const name = nbBookName(raw.name) || (raw.id === NB_MAIN ? NB_MAIN_NAME : 'Notebook'); const t0 = Number.isFinite(+now) ? Math.round(+now) : 0;
  return { id: raw.id, name, c: nbInt(raw.c, 0, 8.64e15, t0) };
}
/* the list of notebooks, made safe: junk dropped, the first of an id kept, names that repeat get a number, at most NB_LIMITS.books */
function nbBooksClean(list, now) {
  const out = []; const seen = new Set();
  (Array.isArray(list) ? list : []).forEach((r) => { if (out.length >= NB_LIMITS.books) return; const b = nbBookClean(r, now); if (!b || seen.has(b.id)) return; seen.add(b.id); b.name = nbBookNameUnique(b.name, out); out.push(b); });
  return out;
}
/* the list of notebooks that matches the pages: never empty (My notebook is made when there is none), and a notebook that pages name but the list does not (the list was lost, or an old backup came in) is made, called
   Recovered notebook, so no page is ever hidden. changed: the list had to be mended */
function nbBooksResolve(books, pages, now) {
  const list = nbBooksClean(books, now); const have = new Set(list.map((b) => b.id)); const t = Number.isFinite(+now) ? Math.round(+now) : 0; let changed = false; const named = new Set();
  (Array.isArray(pages) ? pages : []).forEach((p) => { if (p && typeof p.nb === 'string') named.add(p.nb); });
  if (!list.length) { list.push({ id: NB_MAIN, name: NB_MAIN_NAME, c: t }); have.add(NB_MAIN); changed = true; }
  [...named].sort().forEach((id) => {
    if (have.has(id) || !nbBookIdOk(id) || list.length >= NB_LIMITS.books) return;
    if (id === NB_MAIN) list.unshift({ id: NB_MAIN, name: nbBookNameUnique(NB_MAIN_NAME, list), c: t }); else list.push({ id, name: nbBookNameUnique('Recovered notebook', list), c: t });
    have.add(id); changed = true;
  });
  return { books: list, changed };
}
/* two lists of notebooks as one: those of `a` first, then those of `b` that are not in it; a notebook in both keeps b's name (a backup's copy replaces, as a page of the same id does) */
function nbBooksMerge(a, b) {
  const out = nbBooksClean(a, 0); const at = new Map(out.map((x, i) => [x.id, i]));
  nbBooksClean(b, 0).forEach((x) => { if (at.has(x.id)) out[at.get(x.id)] = Object.assign({}, out[at.get(x.id)], { name: x.name }); else if (out.length < NB_LIMITS.books) { at.set(x.id, out.length); out.push(x); } });
  return nbBooksClean(out, 0);
}
/* the pages of one notebook; and how many a notebook holds (an Inbox with nothing in it, or one that was never kept, is not counted) */
const nbPagesOf = (pages, book) => (Array.isArray(pages) ? pages : []).filter((p) => p && p.nb === book);
const nbCountable = (p) => !(nbIsInbox(p.id) && !String(p.body || '').trim());
function nbBookCounts(pages) {
  const m = new Map(); (Array.isArray(pages) ? pages : []).forEach((p) => { if (!p || !nbCountable(p)) return; m.set(p.nb, (m.get(p.nb) || 0) + 1); }); return m;
}
/* which notebook is open: the one the settings name, if there is such a notebook, else the first. Which page collects clips in a notebook: the settings' `collect` is a page id (from before there were several notebooks: it
   is My notebook's) or a table of page ids by notebook */
const nbCurOf = (settings, books) => { const c = settings && typeof settings.cur === 'string' ? settings.cur : ''; const list = Array.isArray(books) ? books : []; return list.some((b) => b.id === c) ? c : list.length ? list[0].id : NB_MAIN; };
function nbCollectOf(settings, book) {
  const c = settings && settings.collect; if (typeof c === 'string') return book === NB_MAIN ? c : '';
  if (c && typeof c === 'object' && !Array.isArray(c) && Object.prototype.hasOwnProperty.call(c, book) && typeof c[book] === 'string') return c[book]; return '';
}
function nbCollectPut(settings, book, pageId) {
  const s = Object.assign({}, settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {}); const old = s.collect; const map = {};
  if (typeof old === 'string' && old) map[NB_MAIN] = old; else if (old && typeof old === 'object' && !Array.isArray(old)) Object.keys(old).forEach((k) => { if (nbBookIdOk(k) && typeof old[k] === 'string' && old[k]) map[k] = old[k]; });
  if (pageId && !nbIsInbox(pageId)) map[book] = pageId; else delete map[book];
  if (Object.keys(map).length) s.collect = map; else delete s.collect; return s;
}

/* ── one notebook as a file: the app's own JSON (the name, and every page with its id, title, words and times), so it can be read back whole ── */
function nbBookFile(book, pages, now) {
  const recs = nbOrder(nbPagesOf(pages, book && book.id).filter(nbCountable)).map((p) => ({ id: p.id, title: p.title, body: p.body, c: p.c, u: p.u }));
  return { app: 'The Lamplighter Project', kind: 'notebook', format: 1, name: nbBookName(book && book.name) || NB_MAIN_NAME, exportedAt: nbIso(Number.isFinite(+now) ? +now : 0), pages: recs };
}
/* a notebook file read: { ok, name, pages } with the pages made safe (no notebook on them), or { ok: false, error } saying plainly what is wrong */
function nbBookRead(parsed, now) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.kind !== 'notebook' || !Array.isArray(parsed.pages)) return { ok: false, error: 'This file is not a notebook saved from the Lamplighter Project. (A whole backup is brought in from Setup, with Import; Markdown files are brought into the open notebook from its menu.)' };
  if (parsed.format !== undefined && parsed.format !== 1) return { ok: false, error: 'This notebook file comes from a newer version of the app than this one.' };
  const pages = nbCleanList(parsed.pages.map((r) => (r && typeof r === 'object' && !Array.isArray(r) ? Object.assign({}, r, { nb: NB_MAIN }) : r)), now).slice(0, NB_LIMITS.pages);
  return { ok: true, name: nbBookName(parsed.name) || 'Imported notebook', pages: pages.map((p) => ({ id: p.id, title: p.title, body: p.body, c: p.c, u: p.u })) };
}
/* a notebook file brought in as a NEW notebook: its own name (a number after it if that name is used), its pages with their ids where free and fresh ids where not, its Inbox as the new notebook's Inbox */
function nbBookPlan(read, books, allIds, now, salt) {
  const ids = new Set(allIds || []); const bid = nbBookNew(new Set((books || []).map((b) => b.id)), now, salt); const book = { id: bid, name: nbBookNameUnique(read.name, books), c: Math.round(+now || 0) }; const inbox = nbInboxOf(bid); const out = [];
  (read.pages || []).forEach((p, k) => {
    let id; if (nbIsInbox(p.id)) id = inbox; else { id = nbIdOk(p.id) && !ids.has(p.id) ? p.id : nbNewId(ids, now + k, salt); }
    ids.add(id); const rec = nbClean({ id, title: p.title, body: p.body, c: p.c, u: p.u, nb: bid }, now); if (rec) out.push(rec);
  });
  return { book, pages: out };
}
/* a page copied into a notebook: a new id, the same title (with "(copy)" after it when it goes to the notebook it is already in) and words, times now */
function nbCopyRec(rec, toBook, taken, now, salt) {
  const id = nbNewId(taken, now, salt); const t = nbTitleOf(rec); const title = rec.nb === toBook ? nbTitleClean(t + ' (copy)') : t;
  return nbClean({ id, title, body: rec.body, c: now, u: now, nb: toBook }, now);
}
/* a clip taken out of a page's words, when it is there exactly as it was written (the quote and, after it, the note if there was one): the new body, or null */
function nbRemoveClip(body, md) {
  const want = nbBlocks(md); const have = nbBlocks(body); if (!want.length) return null;
  for (let i = 0; i + want.length <= have.length; i++) { if (want.every((w, k) => have[i + k] === w)) return nbJoin(have.slice(0, i).concat(have.slice(i + want.length))); }
  return null;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { NB_LIMITS, NB_INBOX, NB_MAIN, NB_MAIN_NAME, nbBookIdOk, nbInboxOf, nbIsInbox, nbInboxBook, nbBookName, nbBookNew, nbBookNameUnique, nbBookClean, nbBooksClean, nbBooksResolve, nbBooksMerge, nbPagesOf, nbCountable, nbBookCounts, nbCurOf, nbCollectOf, nbCollectPut, nbBookFile, nbBookRead, nbBookPlan, nbCopyRec, nbRemoveClip, NB_TEMPLATES, NB_QUESTIONS, nbEsc, nbIdOk, nbLibIdOk, nbNewId, nbClean, nbCleanList, nbTitleOf, nbToMd, nbSplitFront, nbFromMd, nbFileName, nbPlanImport, nbSafeHref, nbReadHref, nbReadPlace, nbInlineTokens, nbInlineHtml, nbTokensHtml, nbPlain, nbBlocks, nbJoin, nbBlockKind, nbBlockSource, nbBlockTags, nbTagsOnly, nbBlockHtml, nbHtml, nbToggleTask, nbAnalyse, nbIndex, nbRefs, nbQuoteOf, nbBacklinks, nbEscMd, nbClipMd, nbHasClip, nbAppend, nbTemplate, nbQuestion, nbQuestionMd, nbSearch, nbOrder, nbClipCount, nbHeadingLevel, nbHeadingText };
