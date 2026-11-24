# How the Lamplighter Project reaches people

Goal, in the maker's words: everyone with a computer or an internet connection should be able to have it, for free or as near free as possible, make it their own, and host it themselves if they like. The whole database and the whole interface are free. A social "gathering" part may one day be donation-funded, as a separate layer.

**Name (16 November 2026).** The project was called Beatlab until today. It is now **The Lamplighter Project** (short form **Lamplighter**, used only where space is tight: file names, the home-screen label, the narrow header). The lamplighter lights a public lamp at every post, for strangers, lamp by lamp. Around the name: the people who copy it and hand it on are **the Lamplighters' Guild**; the gathering layer (Layer 4, later) is **the Round Table**; the motto is **Lamp by Lamp**. The Guild, the Round Table and the motto are for the docs only: the app claims no such features yet. The built page is `Lamplighter.html` and the zips are `Lamplighter-<kind>-<stamp>.zip`. The zips now in `release/` (stamp 00e6b9) and `PASS IT ON.html` were made before the rename and still say Beatlab; the next `make_release.py` run replaces them (it treats a `Beatlab-…` zip as an older release of the same kind). Kept as `beatlab` on purpose, because stored data and files in people's hands depend on them: the browser-storage key `beatlab.v1.`, the `BEATLAB_*` globals in the data files, the cache and IndexedDB names and the `.beatlab` pack extension; a backup or text pack made as "Beatlab" still opens. Web addresses were checked by DNS lookup only (16 Nov 2026): `lamplighterproject.com`, `.net`, `.app` and `.io`, and `projectlamplighter.*`, showed no record; `.org` gave no answer; confirm at a registrar before relying on any of them.

Facts below were researched on 15 Nov 2026 from the sources named. Limits and prices change, so check the source before relying on a figure. "Unverified" means no official source was found.

## What there is to ship (measured)

| Piece | Size | Notes |
|---|---|---|
| `Lamplighter.html` | 2.9 MB (1.0 MB zipped) | The whole app. Needs no server, no account, no network. |
| `atlas/` | 3.3 MB (3.2 MiB) | The map and catalogue data. |
| `texts/` | about 1,802 MB (1,719 MiB), 2,581 files | 1,413 English texts (among them the study of religion’s classics and the great reference works, volume by volume) (and the picture files of some of them, and the printed page numbers of 1,073 of them: one `pg-<id>.js` file each and `pgs.js`, 9 MB in all), loaded one file at a time when a book is opened. Largest file `x-mbh.js` is 15.0 MB. Every Library collection is a pack that a download can leave out (`tools/release_packs.json`; see item 4b below). |
| `similar/` | 66 MB (63.3 MiB) | Powers "Find similar passages" (445 texts, 319,867 passages, rebuilt 24 November 2026; the study aids, occult, Masonic, field-record, folklore, witchcraft and folk-tale shelves are left out of it on purpose, and so are nine of the newest texts, whose reasons are in `tools/similar_skip.json`). Its big file is split into four (16.5, 13.0, 15.9 and 13.0 MiB), so each is under 25 MiB. |
| `dictionary/` | 20.5 MB (19.7 MiB), 20 files | Webster’s 1913 for Look up, the Glossary page and the search box: 113,321 entries in 19 files of about 1.1 MB (largest 1.1 MB), built by `tools/build_dictionary.py` from Project Gutenberg eBook #29765 (public domain). Optional: without it the app works and the Look up box says this copy has no dictionary. |
| `bibles/` | 66 MB (63 MiB), 1,001 files | The Bibles pack: 17 public-domain English Bible versions, verse by verse, one file per version per book (largest about 0.4 MB). Optional: without it the app works and only the side-by-side page is empty. |
| Zip: app only | 1.0 MiB | Opens, but with no texts, map or similarity. |
| Zip: app + atlas | 1.6 MiB | The study half: stations, rites, stories, practice. |
| Zip: app + atlas + texts | 728.3 MiB | Everything except Find similar and the Bibles pack; includes the dictionary. |
| Zip: everything except the Bibles pack | 766.9 MiB | Library, map and Find similar. |
| Zip: the Bibles pack alone | 19.9 MiB | An optional add-on folder. |
| Zip: the dictionary pack alone | 6.3 MiB | An optional add-on folder (`Lamplighter-dictionary-pack.zip`). The zips with the texts include the dictionary. |
| Zip: everything including the Bibles pack | 786.8 MiB | The full thing. |
| Zip: sources only | 515.1 MiB | The study library without the six optional shelves (occult, Freemasonry, shamanic, folklore, folk tales, the imagined shelf): map, texts, Find similar. |
| Zips: the optional shelves, one each | 27.6 (occult), 15.2 (Freemasonry), 150.1 (shamanic), 25.9 (folklore), 32.1 (folk tales) and 0.9 MiB (imagined) | Each is unzipped beside `Lamplighter.html` to add that shelf to a sources-only copy. |

The zip rows are measured: `tools/make_release.py` made all fifteen zips on 17 November 2026 for release 2026-11-18-a0a6d3 (every checksum in `SHA256SUMS.txt` verified and `unzip -t` clean; the page inside is the one in the project folder). The sixteenth kind, `Lamplighter-downloads-pack` (every text as an e-book, a text file and Markdown), is 1,934.3 MiB in 4,243 files: GitHub allows a release file under 2 GiB, so it has about 114 MiB to spare. Split it into an e-book pack and a text pack before it grows. The app’s own size sentence (Setup, Freedom, “Take it with you”) now carries the measured figures (a zip of about 765 MB with the texts, about 825 MB with everything).

User data (marks, notes, threads, journal) lives in the browser's localStorage and stays on the device. The app already has an export in Setup.

## How small can it be made (measured 20 November 2026)

The maker asked on 20 November whether the project can be made small enough to ask people to take it (“a 15 GB download”) and whether very strong compression would help. **The 15 GB is the project folder, not the product:** `texts/` 1.7 GB (the library: what a person needs), `downloads/` 3.8 GB (the same texts again as e-book, text and Markdown; the reader's Save makes any one of them on demand), `release/` 4.9 GB (zips already made) and `tools/cache/` 4.1 GB (sources fetched while building, never shipped). The page itself is 4 MB.

Everything the zips carry (page, atlas, texts, Bibles, Find similar, dictionary, icons: 2,020,372,480 bytes, 1,927 MiB, 1,448 texts) compressed as one solid stream, `tar -cf - … | zstd -19 --long=27 -T0` (a 128 MB window) and with `xz -9e`. The measurement only read the project and wrote nothing to it. The pictures were cut out of each text file by their `data:image/…;base64,` addresses to measure the words alone.

| Part | Raw | Solid zstd | Of raw |
|---|---|---|---|
| The texts without their pictures (2,643 `.js` files) | 1,628 MB | 438 MB (418 MiB) | 27% |
| The pictures: 2,703 images in 84 `fig-*.js` files (201 MB of JPEG and 24 MB of PNG, kept as base64 inside the files) | 225 MB | about 179 MB (171 MiB) | 80%: images are already compressed |
| `similar/` | 61.5 MB | 39.3 MB (37.5 MiB) | 64%: dense numbers |
| `bibles/` | 68.7 MB | 9.5 MB (9.1 MiB) | 14% |
| `dictionary/` | 20.7 MB | 4.8 MB (4.6 MiB) | 23% |
| atlas, page, icons | 8.5 MB | 1.8 MB (1.7 MiB) | 21% |
| **Everything as one stream** | **2,020 MB** | **zstd 673 MB (642 MiB); xz -9e 654 MB (623 MiB)** | 33% and 32% |

The zip of everything made on 17 November was 786.8 MiB for a library about 60 MiB smaller than today's (42% of raw), so a zip made today would be about 813 MiB (estimated at the same ratio). A solid zstd or xz kit is about a fifth smaller, and a zip is about a quarter larger than a zstd kit. The words alone compress to about 27%, and nothing in this family of methods does much better: **the floor of the readable library is about 420 MiB**. What keeps the whole above that is the pictures (27% of the compressed kit) and the Find similar index (6%).

What a website sends for one text (150 random texts, 139 MB, each compressed on its own): gzip -9 42.6%, brotli 11 35.1%, zstd -19 35.8%. The mean text is 905 KB raw and about 318 KB with brotli. Texts load one file at a time (the largest, `x-mbh.js`, is 15 MB raw), so a visitor pays only for what they open.

**What could still shrink it, and what it costs (proposals; nothing built):**
- *The plates as an optional pack* (`fig-*.js`): 171 MiB less in the default kit. The books keep their words; whatever the reader and the Pictures gallery show for a book whose plates are not in the copy has not been checked and must say so plainly (explain, don't remove).
- *Re-encoding the JPEG plates* (to WebP or AVIF): perhaps a quarter of the picture part, unmeasured. It changes the images, so it is the maker's decision.
- *Stronger text compression* (PPMd, context mixing): usually a further tenth or more on text, unmeasured, but slow to unpack and it needs special tools.
- *Both kinds of kit:* a zip (opens everywhere) and a zstd or xz kit (needs a free unpacker on some computers). `tools/make_release.py` makes zips only; a zstd or xz kit needs a small script.
- *Leave `downloads/` out of the main kit* (it already is its own 1.9 GB pack) and never put `originals/` in one.

**Tiers to offer (proposed), sizes as zstd (a zip is about a quarter larger):**
1. *Online, or installed from the website:* nothing to download first. A visitor pays for the page and the texts they open; Setup's “Save for offline” keeps one library at a time with its size shown.
2. *App and map:* 1.6 MiB zipped.
3. *Reading kit* (app, atlas, texts without plates, dictionary, Bibles): about 433 MiB.
4. *Plus Find similar:* about 471 MiB.
5. *Plus the plates, the full kit:* about 642 MiB (623 MiB with xz).
6. *Never in a kit:* the downloads pack (not needed) and the originals (about 102 GiB if ever fetched).

## One folder to copy: books, downloads and originals (added 17 November 2026)

The maker asked (17 November) for a structure in which books and PDFs are easy to add and one copied folder carries every original text and every download. The project folder now has, beside `Lamplighter.html`, the app's own data folders (`texts/ atlas/ bibles/ similar/ dictionary/`, unchanged) and three more, each with a tool, a short READ ME and a page that lists what is in it:

| Folder | What it holds | Made by | Size on 17 Nov 2026 | In the zips |
|---|---|---|---|---|
| `downloads/` | every library text as an e-book (`epub/`), a text file (`txt/`) and Markdown (`md/`), on shelves named like the Library's collections, as `<Title> [<id>].<ext>`; `index.html` lists them all, `index.json` is the same for programs | `node tools/make_downloads.js` (the app's own export code, so the files are what Save makes: printed page numbers and pictures included) | 3.75 GiB, 4,239 files (1,413 texts × 3 formats; epub 0.81, txt 1.47, md 1.47 GiB) | `Lamplighter-downloads-pack.zip`, made whenever `downloads/` is there (1,934.3 MiB zipped, measured) |
| `originals/` | the sources' own files for each text, kept as published: the PDF of the scan, the source's own EPUB, the plain full text, DjVu, Kindle, the web page; the same shelf and title folders as `downloads/`; `index.html`, `index.json` and `index.js` (what the app reads) | `python3 -I tools/fetch_originals.py` (from the addresses in `texts/originals.js`) | **not fetched yet.** If everything were: 5,128 files, about 102 GiB (EPUB 53, PDF 42, DjVu 4.5, full text 1.7, Kindle 0.4, web pages 0.2) | only with `make_release.py --with-originals` (`Lamplighter-originals-pack.zip`, stored, not recompressed) |
| `books/` | the reader's own books: PDFs, e-books (.epub), web pages, Markdown, text; folders inside are shelves | the reader drops files in; `node tools/add_books.js` writes `books/index.js` and `books/_made/<id>.js` | theirs | never (it is private) |

**Add a book or a PDF.** Put the file in `books/` (a folder inside it is a shelf; `Author - Title.pdf` is read as an author and a title), run `node tools/add_books.js`, open the page: the Library has a collection "Your books and PDFs". Text books (.txt, .md, .html, .epub) are turned into library texts by the same code as Setup's "add a text of your own", so the reader, marks, notes, search and Save work on them; a PDF is listed with its title and author (read from the file when it names them) and opens in the browser's own PDF viewer, in a page of its own with "Open", "Show it here" and "Save a copy". Running the tool again changes nothing; an id comes from the file's path, so marks stay with a book that is only updated, and a moved or renamed book is a new book. A file with a name the page cannot follow (a colon, `?`, `#`, a backslash) is named in the tool's output, not added. Code: `src/js/2z-books-core.js`, `src/js/6zq-books.js`, `tools/add_books.js`; tests: `tests/books.test.js` (56 checks). The project folder has a double-click helper, `Add books.command`, and a `books/` folder with two examples (a text and a PDF that explain the shelf; delete them freely).

**Copy the whole folder.** Everything the app uses, and everything a person might want to keep without the app, is plain files in plain folders: copy the project folder to a USB stick, a school server or a phone and it all comes with it. `downloads/index.html` and `originals/index.html` open in any browser without the app. `make_downloads.js` rebuilds only what is out of date; `fetch_originals.py --index` makes the lists again from whatever is in `originals/` (so files can be copied in by hand).

**Fetching the originals is the maker's call, and large.** `python3 -I tools/fetch_originals.py` with no `--go` only prints the plan (files and GiB per kind). Nothing is fetched until `--go` with `--formats=...` (it refuses without it). One file at a time, 6 seconds apart, a half-finished file is resumed, a file already there is skipped, and the run stops at the first "too many requests" or "unavailable" answer (the maker's rule for the sources: "space em out. dont hit the limiter again"). At 6 seconds apiece the full-text tier (1,463 files, 1.70 GiB) takes about two and a half hours of waiting plus the transfer; the EPUB tier (1,155 files, 53 GiB) and the PDF tier (1,425 files, 42 GiB) are many hours each. The app offers a text's files in "Where this text comes from" (a card "On this computer", `src/js/6zr-local.js`, `src/js/2z-local-core.js`, `tests/local.test.js`) when `originals/index.js` lists them.

**Not done, and why.**
- Adding a *library* text (as opposed to a reader's book) still means a builder spec in `tools/` and a line in the code table `LIB_RAW` (`src/js/24-data-path-lib.js`), then a rebuild of the page. Making the Library read its catalogue from data (so a text is two files dropped into `texts/`) touches the files the collect session owns, so it waits for a quiet moment.
- The tool is not in the zips and needs Node.js, so readers add books inside the app instead (done 17 November): Texts, My reading, "Your own texts" (`#/path/own`) takes files, PDFs and whole folders, picked or dropped. Text, Markdown, web pages and e-books become texts as before (kept in the browser, and in Export all). A PDF is kept in this browser as the file itself, in a small database of its own (`lamplighter-pdfs`), joins the shelf "Your books and PDFs" and opens in the browser's PDF viewer; it is *not* in Export all (the page says so: keep the file). A folder is read by its endings, other files are left alone and counted, and for PDFs the folder inside the chosen one becomes the shelf. Tested in the browser pane: pick, list, reload, open, remove, folder-style pick.
- A PDF's words are not in the app's search (reading a PDF's text needs a PDF library; the page has none). Its title and author are listed; the browser's PDF viewer has its own find.
- The website folder (`tools/make_site.py`) leaves out `downloads/`, `originals/` and `books/`: they are for the download and for a person's own copy.

## The layers

**Layer 1: a file anyone can keep (free, forever, no one's permission needed).**
A zip of the folder, with a one-page `READ ME FIRST`. Unzip, double-click `Lamplighter.html`. Works offline, from a USB stick, on a library or school computer, with no internet at all. This is the most important layer for "everyone with a computer". Put the same zip in several independent places so no single host can take it away:
- GitHub Releases (free; I believe a release attachment can be up to 2 GiB, which was not checked here).
- Zenodo: free, up to 50 GB and 100 files per record, kept "for the lifetime of the repository" (CERN, at least 20 years), a DOI for each version, and a licence is required on public files.
- Internet Archive: free account to upload; the item page is shareable and torrents are auto-generated for many items. There is no written permanence guarantee and items can be removed.
- A torrent of the zip, for people who already use one. Free, but lasts only while people seed it.

**Layer 2: a website (free tier, no server of our own).**
The same folder, published as a static site, so a person with only a browser and a connection can use it with nothing to download. The whole folder is now 2,005 MiB in 3,872 files (a fresh `make_site.py` build, 24 November 2026: texts 1,847 MiB, bibles 63, Find similar 63, dictionary 20, atlas 4; the largest file is `texts/fig-a-spen.js` at 16.8 MiB, then `similar/chunks.js` at 16.5). A link that shows a picture and a sentence on Facebook needs `make_site.py --url=https://<the public address>` (it writes the share tags into the site's `index.html`; `icons/share.png` is the 1200 x 630 picture). It also writes a small `404.html`: a site without one is taken by Cloudflare Pages for a single-page app and answers every path that is not a file with `index.html` and a 200, and the app looks for the optional `books/index.js` and `originals/index.js`, which the website does not have (each would come back as the 3 MB page, read as a script). Without the six optional shelves (`make_site.py --optional`) it is still 1,480 MiB (3,040 files), so it is over the 1 GB that GitHub Pages and GitLab Pages allow, and the maker has said that size is not a constraint (16 November). Of the free hosts below only Cloudflare Pages is known to take the whole site (see "A free website" below):

| Host | Free-tier facts (15 Nov 2026) | Fits? |
|---|---|---|
| GitHub Pages | 1 GB published site, soft 100 GB/month bandwidth. Public repo on the free plan. Terms bar online business and commercial SaaS. Git blocks files over 100 MiB. | No, as it stands: even the lean website (`make_site.py --optional`) is 1,356 MiB and the full one 1,813 MiB, both over the 1 GB limit (17 Nov 2026). GitHub still holds the code, and the zips in Releases |
| Cloudflare Pages | 20,000 files, **25 MiB per file**, static requests free and unlimited. Cloudflare now steers new projects to Workers Static Assets, which is also free for static requests. | Yes, the only free host known to take the whole site: 3,872 files (limit 20,000) and a largest file of 16.8 MiB (`texts/fig-a-spen.js`; limit 25). The dashboard's drag-and-drop upload stops at 1,000 files, so upload with Wrangler (up to 20,000 files) |
| Netlify Free | 300 credits/month hard cap (about 15 GB of bandwidth by my arithmetic). Open Source plan: 10,000 credits, non-commercial only, needs a "powered by Netlify" link. | Yes, bandwidth is the limit |
| GitLab Pages | 1 GB | No: the lean website is 1,356 MiB and the full one 1,813 MiB, over 1 GB |
| Codeberg Pages | Free and libre projects only; limits undocumented (repo quota 750 MiB) | Neither fits the 750 MiB quota: the lean website is 1,356 MiB and the full one 1,813 MiB |
| Vercel Hobby | Personal or non-commercial use only; CLI upload capped at 100 MB | No: even the lean website is 1,356 MiB |

## Getting it to people (updated 16 November 2026)

The product is the set of zips in `release/` (fourteen of them; `python3 -I tools/make_release.py` rebuilds them and `SHA256SUMS.txt`). Anything that moves a file moves the Lamplighter Project: a USB stick, a friend's download, a link by email, a torrent. A website is optional. Nothing here needs GitHub. If GitHub is wanted, the library does not have to be broken up to fit; it has to be split between three places, because GitHub has three different limits (GitHub Docs, checked 16 Nov 2026):

1. **Releases hold the zips.** Each file in a release must be under 2 GiB, a release has no limit on total size or bandwidth, and it can have up to 1,000 files. The biggest zips are the downloads pack (1,934.3 MiB, close to it) and the full thing (786.8 MiB), so every zip goes up as it is. This is how the whole library reaches people, offline, in one download.
2. **The repository holds the code, and the website folder if there is one.** Git blocks any file over 100 MiB (the biggest here is 18.6 MiB), and GitHub recommends a repository under 1 GB, strongly under 5 GB. Keep the zips out of it.
3. **GitHub Pages serves a website of up to 1 GB**, and Git LFS cannot be used with Pages. The full website folder is now 1,813 MiB in 3,524 files, and the lean one (`python3 -I tools/make_site.py --optional --limit-mib=1000`, which leaves out the six optional shelves: occult, Freemasonry, shamanic, folklore, folk tales, the imagined shelf, with the "Save for offline" list matching and the Library saying what the site leaves out) 1,356 MiB (17 November 2026). Both are over the limit, so GitHub Pages is no longer a way to serve the library; the tool stops and names the biggest folders, and `--without=<pack>` leaves out more (`python3 -I tools/make_release.py --list-packs` shows each pack's size), which the maker does not want for size's sake. The website goes on Cloudflare Pages instead (see "A free website" below); the tool's options still serve any host that has a limit.

So the split is: **zips in Releases, the website on Cloudflare Pages (or any host with no total-size cap), code in the repository.** The second and third are optional.

Other ways, none of which needs GitHub:
- **The Internet Archive** hosts files for free and for good, and a web page of its own for each upload. Its guidance is items under 100 GB and 10,000 files, and it makes a torrent when something is first uploaded (a staff answer on its forum; not guaranteed for very large items). The zips fit as one item. This is the route that fits "decentralised, no server of ours".
- **A torrent of the zips** needs no host at all, and `python3 -I tools/make_torrent.py` makes one (see "The pass-it-on kit" below). `release/SHA256SUMS.txt` lets anyone check what they got.
- **Any static host** (Cloudflare Pages, Netlify, a Raspberry Pi or any server of your own) serves the website folder; the table above has each one's limits. The whole site now fits only a host with no total-size cap: GitHub Pages, GitLab Pages, Codeberg Pages and Vercel's free tier are out for it (17 Nov 2026).
- **Sneakernet**: one copy on a USB stick or a school server does for a room; Freedom → Take it with you explains how.

Which zip to hand someone: `Lamplighter-everything-<stamp>.zip` for the whole thing, `Lamplighter-sources-only-<stamp>.zip` for the scriptures and sources without the six optional shelves, and any `Lamplighter-pack-<name>-<stamp>.zip` to add a shelf later (unzip it next to `Lamplighter.html`). Nothing has been published or uploaded.

### The release stamp and the pass-it-on kit (added 16 November 2026)

**The stamp.** Every build of the app and every zip carries a release stamp such as `2026-11-16-833ab5`: the day the files last changed and a six-character code worked out from every file of the app (the source `build.py` joins) and the library beside it (`atlas`, `texts`, `bibles`, `similar`, `dictionary`) (`tools/stamp_lib.py`). The date is kept in `tools/release_stamp.json`, so building again on another day without changing anything gives the same stamp; change one character of one text and the code changes and the date moves. `build.py` bakes it into `Lamplighter.html` (`APP.version`, `APP.release`, replacing the fixed `1.0.0`); Setup shows it at the bottom, and Religion → Freedom → Take it with you has a card "Which copy is this?" with a button that copies the line to send someone, and says how many texts the copy holds and which optional packs it leaves out. Copies with the same stamp are the same release; a copy can still leave optional packs out, so the stamp names the release, not every file in the folder.

**The zips.** `tools/make_release.py` reads the stamp from `Lamplighter.html` and refuses (saying "run `python3 build.py` first") if the library has changed since it was built, so a zip's name can never disagree with the app inside. Zips are named `Lamplighter-<kind>-<stamp>.zip`; making a newer release removes the older zips of the same names and the checksum list only lists what is there. Zips are made the same way every time (fixed order, every file dated the release date), so the same files give the same zip, the same checksum and the same torrent; a name you choose with `--name` is used as it is. The read-me inside says the release and the number of texts (placeholders `{{STAMP}}` and `{{TEXTS}}` in `release/READ ME FIRST.txt`), and each pack's read-me says which release it was made for.

**The handout.** `make_release.py` also writes `release/PASS IT ON.html`: one printable page (checked to fit one Letter page) with what the Lamplighter Project is, how to open it, which zip to take and its size, how to check it arrived whole (`shasum -a 256 -c`, `certutil`), the SHA-256 of the everything zip, how to pass it on, the stamp, and blank lines to write where to get the files. It has no web address and no outside files.

**The torrent.** `python3 -I tools/make_torrent.py` makes `release/Lamplighter-<stamp>.torrent` and `Lamplighter-<stamp>.magnet.txt` from the release's zips, `SHA256SUMS.txt` and the handout, one torrent in which a client can pick files. It first checks each zip against `SHA256SUMS.txt` and stops if any differs. With no tracker it relies on the clients' own peer finding (DHT); `--tracker=URL` (repeatable) and `--webseed=URL` (an ordinary web folder `URL/Lamplighter-<stamp>/<file>` that serves as one more source) are the user's to choose, and none is chosen for them. Making the files uploads and announces nothing; sharing begins only when someone opens the torrent in a torrent program that has the zips. Re-run it after anything in `release/` changes. `tests/stamp.test.js` (45 checks) reads a made torrent back with a separate decoder and checks every piece hash, the info-hash in the magnet link and the byte-for-byte repeatability.

Cheapest and simplest, if a host is wanted: the website on Cloudflare Pages (free; the cost, the work and the legal limits are under "A free website" below), the code in a git repository on GitHub mirrored to Codeberg and GitLab, and the zips in a GitHub Release, the Internet Archive and a torrent, so it survives any one of them changing its rules. Opening the site from a web address also makes the app installable and cacheable (see "Later" below).

One real cost to know: full-text search over the library reads all of `texts/` (about 1,802 MB; on a computer it takes about ten seconds). On someone's phone data plan that is a lot. The app already loads one text at a time and lets go of each after searching; a warning before a whole-library search on a connection is worth adding.

**Layer 3: host it yourself (for a community, a school, a congregation, a library).**
Three recipes. Test them before publishing a guide; several steps could not be confirmed.
1. *A free static host.* Create a public repository, add the files, Settings, Pages, "Deploy from a branch". The site appears at `username.github.io`. Browser uploads are capped at 25 MiB per file, so use git for the 2,472 files in `texts/` (3,524 in all). Netlify Drop needs no account (drag the folder in). Cloudflare's dashboard takes a folder or zip of up to 1,000 files, so for this site use Wrangler (`npx wrangler pages deploy FOLDER`, up to 20,000 files; it needs Node.js, and it takes a folder, not a zip).
2. *A computer on the local network.* Install Python, then run `python -m http.server 8000 --directory <folder>` and have others open `http://<that-computer-ip>:8000`. Its own documentation says not to use it in production; for a room of people it is fine. Caddy is an alternative: `caddy file-server --root <folder> --listen :8080 --browse`.
3. *A Raspberry Pi.* Raspberry Pi Imager, Raspberry Pi OS Lite, set a hostname and enable SSH, write the card, boot, `ssh user@hostname.local`, then serve the folder with Caddy as above. A Pi on a shelf in a community centre needs no internet at all.

**Layer 4 (someday): the gathering server, donation-funded.**
*Superseded on 16 November 2026 by the maker's decision: "in the spirit of decentralization i wont be doing the online social aspect. it'll just straight up be a download". No server of ours is planned; this layer stays as the record of what one would cost.*
Shared lists, circles, discussion: anything that has to remember something between people needs a server. Keep it separate from layers 1 to 3 so the library never depends on it. Rough monthly costs: a small Hetzner Cloud server from about 5.49 euros (excluding VAT); Fly.io's smallest machine about 2.19 USD; Cloudflare Workers with D1 has a free tier (100,000 requests/day, 5 GB) and paid plans from 5 USD; Oracle's Always Free tier gives a small Arm server but idle instances can be reclaimed. Ways to take donations:

| Platform | Platform fee | Notes |
|---|---|---|
| GitHub Sponsors | 0% from individuals, up to 6% from organisations | Recipient must live in a supported region (about 100) |
| Open Collective via Open Source Collective | 10% host fee, plus Stripe/PayPal/Wise fees | Needs no legal entity of our own; needs an open-source licence; gifts are not tax-deductible |
| Liberapay | 0% | Processor fees average about 3% (Stripe) and 5.1% (PayPal); recipients in about 112 listed territories |
| Patreon | 10% of income | Plus processing fees |
| Stripe, self-run | None | 2.9% + 30 cents in the US, more for international cards; needs a business or individual account (unverified for individuals) |
| Ko-fi | 0% on tips (third-party sources; Ko-fi's page could not be fetched) | Unverified |

No account has been created for any of these.

## Licensing (decide before the first public release)

Draft licence files now exist in `lamplighter/release/` (MIT for the code, CC0 for the content written for the project), chosen to fit the maker's aims; the maker can change them before the first release. The options were:
- **Code:** MIT or Apache-2.0 for the app (free to reuse and change). For the later server, AGPL-3.0 requires anyone who runs a modified hosted copy for users to offer them its source, which suits a community project.
- **Our compiled work** (the cards, stations, rites, stories, Hidden currents, atlas): CC0 or CC BY-SA. A licence cannot take a public-domain text out of the public domain, so it covers only our own selection and writing.
- **The texts:** each keeps its own status, already recorded in `texts/LICENSES.txt`.
- **A note, not a blocker** (the maker's decision, 15 Nov 2026: do not worry about copyright; this is a liberation project funded only by donations and the cost of the website): the library's "public domain" means US public domain (published before 1931 as of 2026; 1931 works enter on 1 Jan 2027). In the EU and UK copyright runs life plus 70 years, so a text whose translator died in 1956 or later may still be protected there. Known cases: Odeberg (3 Enoch), Dubs, Evans-Wentz. Everything in the Bibles pack is stated to be public domain on its own source page, and in-copyright Bibles (NIV, ESV, NASB and the like) are not included.
- **The imagined shelf** (added 16 November 2026, `tools/texts_imagined.py`): six fiction and poetry texts from Project Gutenberg. Longfellow’s Dante (1867), Milton and Bunyan are public domain everywhere. H. P. Lovecraft died in 1937, so his tales are public domain in the EU and UK (life plus 70 years, since 2008), and the three included (*The Festival*, 1925; *The Call of Cthulhu*, 1928; *The Dunwich Horror*, 1929) were published before 1930, so they are public domain in the US too. Later Lovecraft tales (some first printed in 1931 or later, with a less clear US status) are left out on purpose. Lord Dunsany (died 1957) is not yet out of copyright in the EU and UK and is not included.

## A free website, and what the law lets us put on it (researched 17 November 2026)

The maker asked what it would take and cost to turn the project into a free website, where the legal limits lie for books published after 1930 that cost money, whether a bought book can be hosted, and whether peer-to-peer is a way round. This is general information from the sources named at the end, not legal advice; limits, prices and law change, so check the source before relying on a figure. The maker's decision of 15 November under "Licensing" above stands; this section adds what a public website changes. Nothing has been created, bought or uploaded.

### What it costs

| Item | Cost | Notes |
|---|---|---|
| Hosting on Cloudflare Pages | $0 | Free plan: 20,000 files and 25 MiB per file per site, 500 deploys a month, static requests free and unlimited. The documentation names no total-size cap (checked 17 Nov 2026). The whole site is 3,524 files and 1,813 MiB, largest file 24.1 MiB. Workers Static Assets has the same limits. |
| An address of our own | about $10 to $11 a year, optional | Cloudflare Registrar charges the registry's price: .com about $10.46, .org about $8.50 the first year and $11.20 on renewal (price-comparison sites, 17 Nov 2026; the registries are raising prices). Without one the site has a free `<name>.pages.dev` address (`lamplighter.pages.dev` belongs to someone else). Registering is the maker's step. |
| Bandwidth | $0 | Cloudflare charges nothing for static requests on Pages. |
| If Pages ever refused the files | pennies | Cloudflare R2: 10 GB-month stored, 1 million writes and 10 million reads a month free, nothing for bandwidth out, then $0.015 per GB-month. Backblaze B2 is about $6 per TB-month. |
| A server of our own | about $5 a month and up | Not needed. Only the shared lists and circles of Layer 4 would need one, and the maker decided on 16 November not to build them. |

GitHub Pages and GitLab Pages are out for the library itself (1 GB each; the lean site is now 1,356 MiB). GitHub still holds the code and, in Releases, the zips.

### What it takes (my estimates)

1. **Deploy: an afternoon, once the maker has an account.** `python3 build.py`, then `python3 -I tools/make_site.py` writes `site/` (the page as `index.html`, the five data folders, `sw.js`, the manifest, icons, `_headers` for cache rules, `robots.txt`). Upload it with Wrangler: `npx wrangler pages deploy site` (needs Node.js and a Cloudflare login, and takes a folder, not a zip). **Drag-and-drop upload in the dashboard stops at 1,000 files, and the site is 3,524**; Wrangler takes up to 20,000 on the free plan. Upload again after each rebuild. The account and the address are the maker's to create.
2. **Try it on a real https address: an hour or two.** Install and "Save for offline" have only ever run on `http://localhost`. Check Android Chrome, iPhone Safari (Add to Home Screen) and an update (the service worker must not keep serving an old page).
3. **Make whole-library search fit the web: a day for a warning, several days for a real index.** Search streams every text (1,668 MiB) and finishes in about ten seconds from a disk. From a website each full search would pull roughly 0.6 to 0.7 GB over the connection (the texts zip to about that, and the host compresses what it sends), free for us but slow and costly for the visitor unless the library was saved for offline first. The cheap fix is the size warning already noted under "Getting it to people", with "this shelf only" as the default on a web address and "save for offline first" as the way to search everything. The real fix is an index built ahead of time and split into small files by word, so a search fetches a few; it must keep phrase search and the minus sign, and its size is unknown until it is built (the Find similar index of 296,059 passages is 62 MB, for comparison). Find similar itself loads only when used (up to about 54 MiB of index files).
4. **A rights pass before it is public: a day or two, and how far to go is the maker's call.** See "Known items" below: the 94 texts typed from Global Grey pages (its name is already removed from them: see below), a page that lists each text's source and status (`texts/LICENSES.txt` already holds it), and a contact address for removal requests.
5. **Optional, later: pages a search engine can read.** The app routes by `#/...`, so a search engine sees one page; visitors will arrive by links, not by searching for a verse, unless a static page is generated for each text and tradition (about 1,357 and 789). Not needed for the site to work.

### How practical it is

Very. The app is already a static site with no server, no database and no account: a 2.9 MB page that loads each text, map and index file only when asked, so the website behaves like the download, and on a phone (where a zip is awkward: Android opens local files through addresses that break relative paths) it is the dependable way in. What is worse than the download:
- **Whole-library search**, and the first visit to any book, need a connection unless the visitor has saved the library for offline.
- **Notes live in the browser, per web address.** A visitor's marks, notes and own texts belong to that browser at that address; a new address leaves them behind (Setup, Export all and Import carry them across), so choose the address once. Safari clears what a page has stored after 7 days without a visit unless the site is added to the Home Screen (see "Later").
- **The host sees visits.** The app sends nothing about a reader and sets no cookie (`tests/privacy.test.js` fails if it makes any request except loading its own files, sets a cookie or loads anything from another site), and its own wording already says so. But any web host's logs record that an address asked for a file, which is not true of the zip.
- **One place that can be switched off.** A website is a single address; the zips, the torrent (`make_torrent.py`) and the mirrors are what keep the project decentralised, and the website is a convenience in front of them.

### What the law lets us host

This is United States law, which governs a US-hosted site; copyright is national (see "Known items").
- **Published before 1931: free.** Works from 1930 became free on 1 January 2026 (Duke Center for the Study of the Public Domain); works from 1931 become free on 1 January 2027, and each New Year adds one more year.
- **Published 1931 to 1963: free only if the copyright was not renewed** in the 28th year after publication. The New York Public Library counted 162,000 renewals among 642,000 registered copyrights of 1923 to 1963, about a quarter, so many books are free, but each needs a check against the renewal records: Stanford's database of book renewals (1950 to 1993), the Catalog of Copyright Entries (see the Online Books Page) and HathiTrust's volunteer reviewers, who check and open volumes. A missing renewal is strong evidence, not proof (a renewal of an earlier edition, for example). **Works first published abroad can have had their US copyright restored in 1996** (Copyright Office Circular 38B), which matters for translations of foreign books.
- **Published 1964 or later: protected.** Renewal became automatic, so a 1964 book is protected to the end of 2059, and a work created from 1978 on lasts its author's life plus 70 years.
- **A translation or an edition is a work of its own,** protected by its own date: a 1950 English version of an ancient text is protected though the original is not. That is why the Library holds Müller, Legge and Rhys Davids rather than modern translations.

### If we pay for a book, can we host it?

No. Paying buys a copy (for an e-book, a licence to read it), not the right to copy or publish it. Putting a book on a website copies it and shows it to the public, both reserved to the copyright holder, however many copies were bought. The first-sale rule lets the owner of a lawfully made copy sell, lend or give away that copy; it does not allow making new ones, and sending a file makes one. E-books usually come with terms against redistribution, and removing DRM raises a separate legal problem. The idea of one bought copy shown to one reader at a time (controlled digital lending) was tried by the Internet Archive and lost: on 4 September 2024 the Second Circuit held it was not fair use, on all four factors (Hachette v. Internet Archive). What does let us host a book is the rights holder's licence in writing, or an open licence.

### Torrents and peer-to-peer are not a loophole

Copyright attaches to distributing copies, whatever the technology. In a torrent swarm every peer that uploads pieces is distributing; news reports say a federal judge has let authors' claims against Meta go forward on the theory that BitTorrent seeding is distribution (Meta disputes that it seeded, and the reports found show no final decision). Every peer can see the others' addresses, which is how rights holders find uploaders, and US statutory damages can reach $150,000 per work for wilful infringement. A religious purpose does not change this: the one religion-specific exception (17 U.S.C. 110(3)) covers performing or displaying certain works during services at a place of worship, not copying or posting them. Peer-to-peer is lawful, and the right tool, for what we may share: the project's own zips (`make_torrent.py`).

### How in-copyright books can still serve the project

1. **Wait.** The wanted list of post-1930 books (`POST1930_WANTED.csv`, kept by the "collect" session) can carry a column for the day each book becomes free (1 January of the publication year plus 96), so the library grows by a year of books every New Year.
2. **Check non-renewal** for 1931 to 1963 books and record the result beside each.
3. **Ask.** Translators, small presses and university presses often allow free non-commercial educational use, or already publish open access; a licence in writing is what makes hosting lawful.
4. **Use openly licensed translations.** CC0, CC BY and CC BY-SA allow hosting on their terms; NonCommercial and NoDerivatives licences are the awkward ones for a library that asks others to reuse it freely. Check translator by translator: on SuttaCentral, Bhikkhu Sujato's translations are CC0, while other translators there use CC BY-NC, CC BY-NC-ND or CC BY-SA (a secondary page; confirm on suttacentral.net).
5. **Bring your own copy.** Setup's "own texts" import already lets a reader load a book they own into their own browser; nothing is uploaded and no copy is shared. Text packs let someone hand on only what they have the right to share.
6. **List, don't host.** Facts are free: a bibliography, "where to read it" links to libraries and booksellers, and short quotations with commentary (fair use, judged case by case) can describe an in-copyright book without hosting it. This is "explain, don't remove" applied to books we cannot hold.

### The live site (24 November 2026)

The whole library is published on Cloudflare Pages at **https://lamplighter-project.pages.dev** (project `lamplighter-project`; 3,872 files, 2,005 MiB; no analytics, no script from another site). It was built with `python3 -I lamplighter/tools/make_site.py --url=https://lamplighter-project.pages.dev` (the share tags need the address) and uploaded from the `site/` folder. To update it, rebuild the page and the site folder, then:

```bash
mkdir -p /tmp/wr-empty && cd /tmp/wr-empty
npx wrangler@4 pages deploy /absolute/path/to/site --project-name=lamplighter-project --branch=main --commit-dirty=true < /dev/null
```

Two things learned the hard way: run Cloudflare's `wrangler` from an empty folder and pass the directory explicitly, because a version of the tool that detects an AI agent turns a Pages command for a project name that does not exist yet into a Workers deploy of a folder it guesses from the current directory (it picked `downloads/`); and create a new Pages project first with `wrangler pages project create <name> --production-branch=main --force`. Cloudflare answers a missing file with a plain 404 only because the site has its own `404.html`; without one it treats the site as a single-page app and answers every path with the app page and a 200.

### What a first visit costs, and what was done about it (24 November 2026)

Measured on the live site from a cold start. The page is one file: 1,476 KB compressed (4.4 MB decoded), because the whole app is one inline script. The Timeline, which is where the app opens, then asks for four data files
(`texts/index.js` 283 KB, `atlas/events.js` 216, `atlas/core.js` 198, `atlas/world.js` 188), so a first visit is about 2.4 MB. Running the script takes about 0.1 s on a desktop; the cost is the download. A repeat visit asks
the host whether the page changed (`no-cache`, answered with a 304) and keeps the data files for a day; where a service worker is allowed (not in the in-app browsers on an iPhone) the app opens from its own cache.
Find similar is the one big download: its first search fetches the seven-file index, 66 MB.

Done: a **loading screen** (the mark, the name, "Loading…") sits in the page before the app's script, after the inline stylesheet (about 254 KB into the page, so it paints once the first 70 to 80 KB compressed have arrived).
With the connection slowed to 300 KB/s it painted at 0.9 s while the page finished at 15.5 s; on the live site from a cold start it painted at 1.5 s and the document was done at 2.9 s (before it, nothing was painted until the whole
page had arrived). After nine seconds it says a slow connection can take a while; if the app has not taken over when the page is ready (a browser too old to read the script) it says so; without JavaScript it hides itself so the
"needs JavaScript" line shows. Find similar says, before the first search, that it downloads about 66 MB. The site carries an empty `books/index.js` (the catalogue of an empty folder), so the page's one look for a books folder
is not a 404 and a refused script in the console on every first visit. Tests: `lamplighter/tests/loading.test.js` (18), `similar.test.js` (the 66 is kept within 3 MB of the index folder), `packs.test.js`.

Not done, and why: `<link rel="preload">` for the four data files in the site's page (saves the time the script takes to start asking plus one round trip, about half a second on a phone, and downloads them for a visitor who
arrives on a page that does not need them); loading `texts/index.js` only when a page needs it (283 KB less, but the Timeline's Related strip reads it, so the loader would need care for a small gain); splitting the data out of
the single file (it would break the one-file promise); minifying (the page is mostly data). **To test paint timing, do not trust an editor's built-in preview pane** (the one used here painted a streamed page only after the document had finished): use a real headless
browser against a local server that sends the page slowly, and compare `performance.getEntriesByType('paint')` with the navigation entry's `responseEnd`. The scratch rig used for the 24 November 2026 numbers (a throttled server and a short DevTools-protocol script) is not kept in the repository.

### Known items before the site is public

- **Global Grey (name removed 17 November 2026).** 94 texts were typed from Global Grey's "read online" pages. Its terms (globalgreyebooks.com/terms-conditions.html, read 17 November) say the ebooks are for personal use and may be hosted elsewhere only when all its branding, the logo and the website name, has been removed from the files; its donate page offers a thank-you email and no licence, so a donation does not buy permission. The name and every link to its pages are therefore gone from those texts (the licence line reads "a typed copy of the printed edition", `src` is empty), the text index, `texts/LICENSES.txt`, the original-pages sidecar, the downloads and the app's wording, and `tests/gg-name.test.js` fails if the name comes back. Re-sourced 18 November 2026: each text was compared (80 six-word runs sampled from it, looked up in the candidate's own text) with candidate editions on Project Gutenberg and the Internet Archive, and 82 of the 94 now carry, as `src`, the address of the same edition (46 Gutenberg, 36 Internet Archive; the record is `tools/gg_editions.json`, which `texts_gg.py` reads). The source card says "Same edition at …" and the Original page card is back: the Internet Archive ones with the scan's files, the Gutenberg ones with EPUB, HTML and text files checked on Gutenberg's official mirror (gutenberg.pglaf.org), because gutenberg.org itself was returning 503 (retry after an hour) when this was done; once it answers, run `python3 -I tools/texts_originals.py --only=<the ids in gg_editions.json whose address is gutenberg.org>` to add their Kindle files and replace the mirror-checked entries. The words themselves were not rebuilt from those editions. 12 texts have no address: five are in two or four volumes, so no single page holds them (l-bott, l-camp, l-rhys, l-robi, v-doyle); l-greg matches only half of its nearest edition; and six have no scan with a readable text (a-balo, a-wins, h-open, m-grand, m-pull, w-vamp). A written yes from the owner would still settle any doubt about whether the terms reach the read-online pages (they speak of the ebook files). The zips in `release/` (stamp 0e307c, made late on 17 November, after the name was stripped) do not name the site but predate the re-sourcing, so they lack the source addresses; the current build is stamp 380e53. Rebuild them (`make_release.py`, then `make_torrent.py`) before anyone is sent one.
- **Outside the US.** In the EU, UK and Canada copyright runs for the author's life plus 70 years (longer in Mexico); a translator who died after 1955 (Odeberg, Dubs, Evans-Wentz) may still be protected there. A US-hosted site is chiefly under US law, but a rights holder abroad can still write to the host. The maker's decision of 15 November applies.
- **Notices.** A host forwards a takedown notice to the site's owner and may remove the content. Public-domain-only plus a contact address and quick removal is how Project Gutenberg, Wikisource and the Internet Archive work. A project that picks its own texts cannot rely on the safe harbour for services that host other people's uploads (17 U.S.C. 512); if a shared server ever takes uploads, that regime (a registered agent, notice and takedown) applies.
- **A website does not change what is legal.** The same texts in a zip or a torrent are the same legal question; the website only makes them easier to find and to switch off.

Sources, all read on 17 November 2026: Duke CSPD, Public Domain Day 2026 (web.law.duke.edu/cspd/publicdomainday/2026); the Online Books Page, copyright registration and renewal records (onlinebooks.library.upenn.edu/cce); NYPL, "U.S. Copyright History 1923-1964" (2019); HathiTrust, "It's No Secret - Millions of Books Are Openly in the Public Domain" (hathitrust.org/blogs); Copyright Office Circular 38B (copyright.gov/circs/circ38b.pdf); Copyright Alliance, "Second Circuit Rejects Internet Archive's Controlled Digital Lending Scheme" (copyrightalliance.org); Cloudflare Pages limits (developers.cloudflare.com/pages/platform/limits) and its 23 January 2026 changelog on the file limit; the Congressional Research Service legal sidebar LSB10440 on 17 U.S.C. 110(3); TorrentFreak and WebProNews on the authors' case against Meta (secondary reports, not the court order); price-comparison pages for Cloudflare Registrar (secondary).

## What the app needs before Layer 1 and 2 (status, 15 November 2026)

Built, nothing published:
1. **Licence files and `READ ME FIRST.txt`**: `lamplighter/release/` has `LICENSE-CODE.txt` (MIT), `LICENSE-CONTENT.txt` (CC0) and `READ ME FIRST.txt`; the release zips carry them. The two licences are the defaults that fit the maker's stated aims (free, no one's permission needed); the maker may change them before the first public release.
2. **`similar/chunks.js` is split** (since 24 November 2026 into four files, the passage vectors in two halves) into `chunks.js` (16.5 MiB), `chunks-2.js` (13.0 MiB), `chunks-3.js` (15.9 MiB) and `chunks-4.js` (13.0 MiB), so the whole folder fits Cloudflare Pages' 25 MiB per file (the largest file anywhere is now `chunks.js`, 16.5 MiB; `x-mbh.js` is 14.3 MiB). The joined data was checked field by field against the original, and the loader refuses to run on an incomplete set.
3. **The first-screen note about browser storage** is on Freedom → Take it with you and in `READ ME FIRST.txt`, with the way across: Setup → Export all (which now includes the reader's own texts) and Import.
4. **Release checksums**: `tools/make_release.py` writes fourteen zips, each named with the release stamp as `Lamplighter-<kind>-<stamp>.zip` (this list uses the short names; see "The release stamp and the pass-it-on kit"): the six standard ones, the dictionary pack, sources only and six optional shelf packs, and `SHA256SUMS.txt` (verified with `shasum -a 256 -c`; `unzip -t` clean). Measured on 16 Nov 2026: app only 0.8 MiB, with the map 1.4, with the texts 302.9, everything but the Bibles 332.8, the Bibles pack alone 19.9, everything 352.7, sources only 225.5, the dictionary pack 6.3, and six optional shelf packs of 0.9 to 31.9.
4b. **Leaving things out of a download (16 Nov 2026, at the maker's request: "make sure its easy to filter things out")**: every Library collection is a pack of texts (`tools/release_packs.json`). `Lamplighter-sources-only.zip` leaves out the six optional shelves; each has a `Lamplighter-pack-<name>.zip` that is unzipped beside `Lamplighter.html` and found by the app on its next start (a trimmed `texts/index.js` lists the packs, `BEATLAB_TEXTS.packs`, and the Library says which are missing). `python3 -I tools/make_release.py --without=occult,imagined` builds a custom copy, `--pack=<name>` a zip for any collection and `--list-packs` shows what each holds. Inside the app, "Leave areas out" does the same for random passages, search and the Library's list. Tested by `tests/packs.test.js` (a small made-up project) and `tests/leaveout.test.js`.
5. **Storage access** stays inside try/catch in the shared store; `tests/privacy.test.js` also fails if any code touches `localStorage` directly or sets a cookie.
6. **A website folder**: `tools/make_site.py` builds `index.html` plus the libraries, `sw.js`, `manifest.webmanifest`, icons, `offline-manifest.json`, `_headers` (cache rules), `.nojekyll`; it uses hard links where it can and refuses any file over 25 MiB. `release/github-pages.yml` is a ready workflow (inactive).
7. **Installable and offline from the web** (the "Later" item below): built. Needs https (or localhost) to run, so it has been tried on `http://localhost` only; the real test is on a real https host.

Still open: create the repository and turn Pages on (an outward action, not taken), mirrors on Codeberg and GitLab, the tagged release on GitHub, Zenodo and the Internet Archive, a person trying each hosting recipe on a real machine, and the first real https test of install and offline save.

## Later

- **Installable and offline from the web** (built 15 November 2026; see the status above): a manifest plus a service worker, which needs the HTTPS that Layer 2 already gives. Ask the browser for persistent storage. Browser caches differ: Firefox allows the smaller of 10% of disk or 10 GiB, Chromium up to 60% of disk, Safari about 60%; Safari clears script-written storage after 7 days without interaction unless the site is installed to the home screen.
- **Kiwix:** `zimwriterfs` can pack a directory of self-contained HTML into a ZIM, but Kiwix runs dynamic content only in some modes and whether our on-demand script loading works there is untested. A possible secondary channel for people who already use Kiwix, not the main one.
- **Phones:** Android often opens local files through content addresses that break relative script paths, so for phones the web address (Layer 2) is the dependable route; the zip is for computers.

## What comparable projects do

Project Gutenberg offers rsync mirrors and asks for polite bulk downloads; Sefaria publishes a public bulk export (about 26 GB, 85,000 files) and its code under GPL-3.0; Kiwix is a donation-funded nonprofit distributing offline copies; Wikisource publishes dumps (about 3.2 GiB for English). The pattern is the same as this plan: a static copy, a bulk archive in friendly formats, mirrors, and donations for the people who run it.

## Order of work, cheapest first

1. Licences, `READ ME FIRST`, split `chunks.js`.
2. Git repository, GitHub Pages, mirrors on Codeberg and GitLab.
3. A tagged release: zip on GitHub Releases, Zenodo and the Internet Archive, with checksums.
4. A "Host it yourself" page in the app (the three recipes, tested by a real person on a real machine).
5. Service worker and manifest.
6. The gathering server and its donation page, when there is something worth running.
