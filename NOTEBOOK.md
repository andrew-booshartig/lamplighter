# The notebook: design note

Written 18 November 2026 by the Notebook session, for BACKLOG D1 and B6; updated the same day when it was built. The maker: "K.I.S.S. I don't want people getting lost while they study." The feel to aim for is the Zed editor: minimal, quiet, content first.

## What it is

One calm place, **Notebook → My notebook** (`#/notebook`), where a person keeps what they learn: pages of Markdown kept in this browser, clips of passages that link back to the exact place in the book, `#tags`, backlinks from the reader, and four templates. Nothing leaves the browser. Pages export as plain `.md` files and import back.

## The screen

```
┌────────────────────────────────┬─────────────────────────────────────────┐
│ PAGES                       +⋯ │                              Saved   ⋯  │
│ [ Find a page or #tag       ]  │  Resurrection themes                    │
│                                │                                         │
│ Inbox                       3  │  #resurrection #death                   │
│ Resurrection themes         1  │                                         │
│ Gospel of Mark: first…         │  What the Gospels say #gospel           │
│ Reading log                    │  │ And he said unto them, Be not        │
│                                │  │ affrighted … he is risen.            │
│ TAGS                           │  │ — Mark, Chapter 16           (link)  │
│ #death 4   #resurrection 4     │                                         │
│ #gospel 2  #textual 1          │  Compare the ending of Mark … #textual  │
│                                │  ☐ Find the oldest manuscript evidence  │
└────────────────────────────────┴─────────────────────────────────────────┘
```

Pages on the left, the page on the right, nothing else: thin lines, no boxes, no glow, one accent colour, the app's own tokens in both themes. Navigation's tab strip sits above it (My notebook · Highlights and notes · Threads · More). On a phone the list and the page are two screens (the page has "← Pages"). Everything works from the keyboard: Tab through pages and blocks, **Enter** edits the block you are on, **Esc** stops, **Ctrl/Cmd+Enter** starts a new block below, the arrow keys move between blocks at their ends, **Enter** in a list starts the next item (twice ends the list), **n** is a new page, and in the list the arrow keys, Home and End move between pages and Enter on the search box opens the first match (or a `#tag`).

## A page

- A page is a **title** and a **Markdown body**. It is shown as a page; **click a block to edit its Markdown, click away and it is a page again** (a block is a paragraph, a list, a quote, a heading or a code fence, as separated by blank lines, and a heading, a quote and a list that follow each other are separate blocks). Every change is saved (about half a second after the last key, and on leaving); a quiet "Saved" says so, and says plainly when the browser would not keep the pages.
- Safe Markdown only: headings, bold, italic, strike, `code`, links, bullet, numbered and task lists (a ticked box is a click), quotes, rules, code fences, `#tags`. Nothing is HTML: every character typed is escaped as it is read, and a link goes only to a `#/…` place in the app, `http(s):` or `mailto:`; any other link (`javascript:`, `data:`, a relative path) is shown as its words. A page holds up to 1,000,000 characters and the notebook 2,000 pages; what would not fit is refused with a reason, never cut silently.

## Where pages live and their shape

IndexedDB database `lamplighter-notebook`, store `pages`, one record per page (the same kind of store as Your own texts), read once into memory:

```
{ id: 'nmwlj8655ec739a', title: 'Resurrection themes', body: '…Markdown…', c: <created ms>, u: <updated ms> }
```

**Several notebooks (19 November 2026).** A record also carries `nb`, the notebook it is in; a record with none (every page made before there were several) is in the first notebook, **My notebook** (`main`), which is how nothing was renamed or rewritten. The list of notebooks is the app's own store key `notebook.books` (`[{ id, name, c }]`, kept only when it is more than the one default), the open notebook and the page that collects clips in each notebook are in `notebook.settings` (`cur`, and `collect` as a table by notebook; the old single page id still reads as My notebook's). Each notebook has its own Inbox: `inbox` for My notebook, `inbox-<id>` for another. One notebook is exported as JSON (`{ app, kind: 'notebook', format: 1, name, exportedAt, pages }`) and imported as a new notebook. The pure part is in `2z-notebook-core.js` (`nbBooks*`, `nbBook*`, `nbInboxOf`, `nbCopyRec`, `nbRemoveClip`); the API gained `NB.books`, `current`, `setCurrent`, `createBook`, `renameBook`, `deleteBook`, `exportBook`, `importBook`, `movePage`, `copyPage`, `sendClip`, and `NB.pages`, `NB.tags` and `NB.backlinks` answer for the open notebook (`{ all: true }` for every notebook).

`id: 'inbox'` is the Inbox page (made the first time something is clipped, or written in it). The small settings (which page collects clips, the last page opened) are in the app's own store under `notebook.settings`, so Setup's backup carries them with everything else. If the browser will not give IndexedDB (a private window), the notebook says so and works in memory until the tab closes; export keeps it. Two copies of the app open at once: the last write wins.

**As a file** a page is plain text:

```
---
title: Resurrection themes
id: nmwlj8655ec739a
created: 2026-11-18T09:12:33.000Z
updated: 2026-11-18T10:22:00.000Z
---

#resurrection #death

## What the Gospels say #gospel

> And he said unto them, Be not affrighted …
>
> — [*Mark*, Chapter 16](#/path/read/n-mar?s=15&p=5)
```

One page: **Export this page (.md)** from its menu. All pages: **Export all pages** from the list's menu, a zip of `.md` files (one per page, names made unique). **Import** takes `.md`, `.markdown` or `.txt` files, or a zip of them: the front matter is read if there is any (otherwise the first `# heading`, otherwise the file name, gives the title). Import never replaces anything: a page whose words are the same is skipped; a page whose id is already here and whose words differ comes in as a new page "Title (imported)". Setup's **Export all** adds `notebook: [ …records… ]` beside `own`; Setup's Import adds those pages (a page with the same id is replaced by the backup's copy; no page is ever removed, so the notebook is never emptied by it); **Delete everything** wipes the notebook and says so.

## Clips

Select words in any book, choose **Clip to notebook** (the Reader session adds the button; My marks has **Clip** on each highlight, its note going under the quote), and a quote block is added to the end of the page that collects clips: the **Inbox**, unless a page was marked **Collect clips here** in its menu. The block carries the quotation and a citation line that is also the link back:

```
> Whoever wants to be first must be last of all and servant of all.
>
> — [*The Gospel of Mark*, Chapter 9, p. 41](#/path/read/n-mar?s=8&p=34)
```

The address is `#/path/read/<id>?s=<section>&p=<paragraph>`, which opens the reader at that paragraph (checked in the browser: it opens Mark, Chapter 9, scrolled to the paragraph). The citation is the title, the section heading and the printed page where the text has them (the same words as the reader's Copy). What would read as Markdown inside a quotation is escaped, so it reads as the words it is. The same quotation from the same place is not added twice to one page. A short toast says where it went, with an Open link; reading is never interrupted.

## Tags

`#resurrection`: a `#` after a space (or at the start of a line), then a letter, then letters, digits, `_` or `-` (any script). Not a heading's `#`, not `#5`, not inside code or a link or an address. A tag is not case-sensitive. **What a tag marks:** the block it is written in; written in a heading, everything under that heading (until a heading of the same or a higher level); on a line of only tags, the block above it (below a heading, the whole section) or, at the very top of a page, the whole page. **The tag page** (`#/notebook/tag/resurrection`) lists every clip and note carrying the tag across all pages, grouped by page, each with its heading and a link that opens the page at that block. The list on the left shows the tags with their counts; typing `#flood` in its search box and pressing Enter opens the tag.

## Backlinks from the reader

Nothing extra is stored: the pages are read for links to the reader. `NB.backlinks(id, s, p)` answers "where does this passage appear in my notebook" (page, block, the quotation, an address that opens the page at that block), so the reader can show a small line under a paragraph or in its bar. Editing a clip by hand, or importing one, changes the answer by itself.

## Templates and the question

New page → **Blank**, **Study notes** (what I read, key ideas, passages, questions, in my own words), **Compare themes** (the question, a place for each tradition's passages, "Where they rhyme", "Where they part", what to check next: the app's own words) and **Reading log** (a dated entry: text, how far, what I noticed, a question). The templates are Markdown with `{{title}}` and `{{date}}` filled in; a new page opens with its title selected, ready to be renamed. **Today's question** is an optional prompt in a page's menu ("Add today's question"): the current station's own questions when the Journey is begun, otherwise one of fourteen plain, neutral questions that changes by the day; it is added as a block with an empty block under it to answer in. The Navigation session removes the question from the stations; these questions stay as data in the notebook's core.

## What it holds of the old places

Nothing is moved and nothing is broken. Navigation's Notebook place has the tabs My notebook, Highlights and notes, Threads and (under More) Journey notes; they all keep their addresses. If the place has no such tabs, the list on the left ends with **From my reading** (Highlights and notes, Bookmarks, Threads) so the older places are one click away. In `6l-threads.js` each highlight in My marks has a **Clip** button and a thread has **Send to notebook** (a page with a heading and a clip for each passage, how they relate, and the thread's note).

## The API for other sessions (`NB`, in `src/js/6zn-notebook.js`; guard with `typeof NB !== 'undefined'`)

```js
NB.clip({ id, text, s, p, heading, page, title, note, to, silent })
  // id: library id ('n-mar', 'u-…')   text: the selected words (required)
  // s: section index   p: paragraph index   (the reader's s= and p=; aliases: section, paragraph)
  // heading: the section's heading   page: the printed page, e.g. 'p. 41'   title: optional (found from id)
  // note: optional words added under the quote   to: a page id (default: the page that collects clips, else the Inbox)   silent: no toast
  // → Promise<{ ok, added, pageId, title, href }>   added is false when it was already there; ok is false (with full: true) when the page is full
NB.open()                    // #/notebook   NB.open(pageId)   NB.open({ tag: 'flood' })   NB.open({ page: id, block: 2 })
NB.tags()                    // → Promise<[{ tag, count, pages }]> most used first
NB.backlinks(id, s?, p?)     // → Promise<[{ pageId, title, block, s, p, quote, href }]>
NB.pages()                   // → Promise<[{ id, title, updated, clips }]>
NB.ready()                   // → Promise, resolved when the pages are read from the browser's storage
NB.addMarkdown(md, { title, to, silent })   // to a page, or as a new page called title when to is 'new'
NB.addThread(thread)         // a thread (from THREADS) as a new page of clips
NB.dump() / NB.restore(list) / NB.wipe()   // Setup's backup, restore (adds or replaces by id, never removes) and delete-everything
NB.exportPage(id) / NB.exportAll() / NB.importFiles(files)
```

## Route and the sections table

`#/notebook` is `Pages.notebook`, and `notebook` is its key in Navigation's sections table (the first tab of the Notebook place; the place stands in with Highlights and notes until `Pages.notebook` exists). `#/notebook/<pageId>` opens a page (`?b=<block>` scrolls to a block and marks it for a moment), `#/notebook/tag/<tag>` a tag, `#/notebook/new` the templates. The page draws its own head and tabs when `secLocate('notebook')` finds them, and leaves the tabs to the router if `notebook` is in `SEC_PLAIN`.

## Borrowed from MatrixLab, and left out

Borrowed: pages are Markdown with a front matter header; click a block to edit it, click away and it is a page; every change is saved as you go; the `#tag` rule; templates as Markdown with `{{title}}`/`{{date}}`; the Inbox (anything sent to the notebook lands at the end of a page); backlinks; raw HTML shown as text and links only to safe places; calm themes from the app's own colours.
Left out on purpose (K.I.S.S.): maths, cells, code that runs, graphs, tables, callouts, coloured text, images, `[[wiki links]]` (page to page), the Home dashboard and task list, vim keys, focus mode, plugins, a formatting toolbar, files on disk, undo beyond the browser's own in a block, an "edit the whole page as text" view. A page prints with the browser's own Print (the list and the menus are hidden).

## Files and tests

`src/js/2z-notebook-core.js` (pure: Markdown reading and writing, blocks, tags, links to the reader, clips, templates, import and export shapes), `src/js/6zn-notebook.js` (the store, `NB`, and the page), the `nbk-` block between `@notebook-begin` and `@notebook-end` at the end of `src/css/app.css`, small hooks in `67-setup.js` (Export all, Import, Delete everything) and `6l-threads.js` (Clip, Send to notebook). `tests/notebook.test.js`: the core and the store and API against a pretend IndexedDB (232 checks); the page itself was driven in the browser (editing, keys, lists, tags, clip, link back, export zip, import, delete, phone width, light theme). All names in the two files begin `nb`, `NB` or `nbk` because every file of the app shares one scope, and `tests/_harness.js` loads the core with the rest.

## For the maker to decide (a default is built; change it if you like)

1. Clips go to the **Inbox** unless a page is marked "Collect clips here" (the alternative is "the page I last had open", which is quicker but can surprise).
2. Setup's Import **adds** the notebook's pages (it never deletes one); the older parts of a backup are still replaced as before.
3. Editing is **per block** (as in MatrixLab). A whole-page "edit as text" view is not built; it would be an easy addition.
4. A page-to-page link (`[[Title]]`) and a "Linked from" list were left out; the reader's backlinks (where a passage appears) are in.
