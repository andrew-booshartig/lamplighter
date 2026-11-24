# The tools folder

What each script and data file in `lamplighter/tools/` is for. None of it is in the release zips: the app is `Lamplighter.html` and the folders beside it; these are what make them. Python scripts run as `python3 -I tools/<name>.py` and Node scripts as `node tools/<name>.js`, from `lamplighter/` (most also work from anywhere). Nothing here sends anything about a person anywhere. The scripts that fetch (the text builders, `fetch_originals.py`, `texts_pages.py`) are meant to be run gently, one file at a time with a pause; `fetch_originals.py` also stops at the first "too many requests" answer and does nothing at all until told with `--go`.

Two subfolders are not scripts: `cache/` (about 4 GB of downloaded source files the builders read, so a rebuild does not fetch again; it can be deleted, but the builders would then fetch everything they need all over again) and `atlas_src/` (the Atlas's data as JSON, the map outlines and the hand-off notes for adding traditions; `json/world_events.json`, `world_strands.json` and `world_meta.json` are the events of world history for the timeline at `#/history`, checked hard by `build_atlas.py` and by `tests/history.test.js`; `json/interaction_causes.json` and `interaction_causes_meta.json` are what brought each recorded connection about, for the page at `#/steps`, checked hard by `build_atlas.py` (`check_causes`) and by `tests/causes.test.js`).

## Build the app and its data

| Script | What it does |
|---|---|
| `build_atlas.py` | Build the Atlas data files that Lamplighter.html loads on demand (`core`, `places`, `texts`, `sites`, `world`, `causes`, `events`, `land`, `index`); stops on a bad world event or a bad cause row |
| `build_bibles.py` | Build the Bibles pack: many public-domain English Bibles, verse by verse, for the side-by-side reader |
| `build_dictionary.py` | Build dictionary/ (next to texts/) from Webster's Unabridged Dictionary, the 1913 edition, as Project Gutenberg eBook #29765 |
| `build_similar.js` | Build the passage-similarity index: similar/index.js, similar/terms.js, similar/motifs.js and similar/chunks.js (split by `split_similar.py` into chunks.js, chunks-2.js, chunks-3.js and chunks-4.js), next to Lamplighter.html (like texts/ and atlas/). About 2.5 minutes, 2 GB; exits 1 if any file is 25 MiB or more. See "Find similar after rounds 24 to 26" at the end of this file for what goes in |
| `passage_pool.js` | Makes `src/js/2z-passage-pool.js`: the editions left out of "Scriptures and sources" on the Random page (the catalogue note says notes are inside and the headings do not mark them; picks that talk about the text; a short list read through, each with its reason). From the Library, nothing fetched. `--check` reports without writing |
| `passage_index.js` | Makes `src/js/2z-passage-index.js`: what the Atlas says about the Library's books, for the filters of the Random page (which religions a book is tied to, as a text of its own, a book about the tradition or an old source; the Atlas's category of the records linked to it; the families and the groups of families; the tradition each branch is nested under). Reads `../atlas` and `../texts`, nothing fetched; the imagined shelf is tied to none. Run it again after the Atlas or the Library changes; `--check` reports (and exits 1) when the file is out of date, and `tests/passage-filter.test.js` says so too. |
| `passage_words.js` | Makes `src/js/2z-passage-words.js`: the lower-case words of the Library's own typed texts that the Random quality gate knows (a damaged scan, the long s read as an f, is told by the share of words not on it). Nothing fetched. `--check` reports the size |
| `split_similar.py` | Split similar/chunks.js (about 60 MB, one object) into four files each well under 25 MiB, so the whole folder fits every free static host (Cloudflare Pages allows 25 MiB per file): chunks.js the small fields and the term weights, chunks-2.js and chunks-4.js the two halves of the passage vectors (q1, q2), chunks-3.js the term columns; run by build_similar.js, safe to run again, fails if any file is 25 MiB or more |
| `build_texts.py` | Build the Lamplighter text library: full copies of public-domain / openly licensed texts for the Library tab |
| `build_texts_util.py` | Helpers for turning Project Gutenberg plain text into reader sections |
| `preview_build.py` | A private build of the app for previewing a change: writes only the file you name, never the shared page (see `WORKFLOW.md`) |
| `make_icons.py` | Draw the Lamplighter Project's mark, with no libraries: plain black, thin warm-white lines, one point of light |
| `make_offline_manifest.py` | Write offline-manifest.json next to Lamplighter.html: the files in each of the five data folders and their sizes, so the website copy can offer "Save for offline" with honest sizes |

## The folders a person can copy (downloads/, originals/, books/)

| Script | What it does |
|---|---|
| `make_downloads.js` | Ready-made files for every library text, in a plain folder anyone can copy |
| `fetch_originals.py` | The sources' own files for every library text, kept in a plain folder you can copy: originals/ |
| `add_books.js` | Add books and PDFs: drop files in the books/ folder beside Lamplighter.html, run this once, open the page |

## Release and distribution

| Script | What it does |
|---|---|
| `make_release.py` | Make the zip files people download, with a checksum list, into <project>/release/. Each unzips to one folder called Lamplighter |
| `make_site.py` | Assemble the website copy of the Lamplighter Project into one folder that any static host can serve (GitHub Pages, GitLab Pages, Codeberg Pages, Netlify, Cloudflare Pages, or a Raspberry Pi) |
| `make_torrent.py` | Make a torrent and a magnet link for a release folder, so the Lamplighter Project can be passed from person to person with no website |
| `stamp_lib.py` | The release stamp: what lets two people with a copy of the Lamplighter Project tell whether they have the same thing |
| `kit_lib.py` | The pass-it-on kit: what someone needs to hand the Lamplighter Project to someone else with no website, no account and no one's permission |
| `packs_lib.py` | Packs of texts: the Library's collections by short name (tools/release_packs.json), shared by make_release.py (zips) and make_site.py (the website folder) |

## Checks and audits

| Script | What it does |
|---|---|
| `assess_coverage.py` | Coverage assessment: for every religion and movement in the Atlas, does the Library hold at least one readable example of its own texts, and does the Atlas link it to any other tradition? Re |
| `audit_flags.js` | Soft flags over the whole database: things worth a human look, not hard failures (those are in tests/data-integrity.test.js) |
| `audit_passages.js` | Draw many passages and pages with the live Random picker (`src/js/6d-passage.js` with the core `2z-passage-core.js`) and judge each with a stricter, independent classifier (footnotes, indexes, bibliographies, contents pages, fragments, mostly names and numbers, scan damage; for verse units, a start at a verse, an end at a sentence and a reference that agrees with the verse numbers; a section name that still carries the builder's tail), printing how the draws are cited and examples to read by eye (`--legacy` for the old four lengths) |
| `audit_terms.js` | Word help coverage: which glossary entries a text actually uses, which entries it never uses, and which capitalised words in it nothing explains yet |
| `audit_texts.py` | Audit the texts/ folder: what is there, whether it is what it says it is, how clean it is, and what the Library and the Atlas catalogue list that is not there |
| `check_links.py` | Checks that every link in src/js/2l-data-path-traditions.js answers |
| `post1930_wanted.py` | Builds POST1930_WANTED.csv and POST1930_WANTED.md in the project root: the books the Library cannot hold because they were first published after 1930 (the United States public domain starts, |
| `similar_bench.js` | A yardstick for the passage-similarity matching: the curated Parallel passages (src/js/2q-data-parallels.js), pairs that scholars have set side by side, each used as a question: given this p |
| `similar_dups.js` | Which books in the similar index are translations or editions of one another? Within each Library group, a sample of passages from every book is matched against the passages of the other boo |
| `atlas_frames.js` | How much main-thread time the Atlas map spends on each frame while it zooms, pans and glides |

## Small helpers

| Script | What it does |
|---|---|
| `catalog_search.py` | Search the cached Project Gutenberg catalogue (cache/gutenberg/pg_catalog.csv) for an English text by title and author words: python3 catalog_search.py "blavatsky+secret doctrine" |
| `inspect_texts.py` | Print each built text's size and its first headings and words: python3 inspect_texts.py a-ada x-gil (no ids: every text but the Bibles) |

## The text builders

`build_texts.py` makes `texts/` from the spec modules below: each lists the texts of one batch (an id, a source, a title, a licence line) and is merged into the builder. A spec names its source (Project Gutenberg, the Internet Archive, Global Grey, eBible, SuttaCentral); only public-domain or openly licensed editions go in. `python3 -I tools/build_texts.py --only=id1,id2` builds just those. The `texts_round<N>.py` files are the numbered batches, in the order they were made.

| Module | What it holds |
|---|---|
| `texts_abrahamic.py` | Specs for further open (pre-1931) English translations from the Jewish, Islamic and Bahá’í traditions: the Legends of the Jews, the medieval Jewish philosophers and the prayer books, the Shi |
| `texts_ancient.py` | Specs for further open (pre-1931) English translations from the ancient world: Egypt, Mesopotamia, Persia, the Gnostics and Mandaeans, Greece and Rome |
| `texts_archive.py` | Texts from archive.org scans of public-domain editions (OCR text) |
| `texts_asia.py` | Specs for further open (pre-1931) English translations from India, Buddhist Asia, China and Japan: the Yoga Vasistha, Vedanta and Tantra texts, Vedic Brahmanas and the Nirukta, Buddhist trav |
| `texts_christian.py` | Specs for further open (pre-1931) English translations from the Christian traditions after the early Church: the medieval Latin and Greek classics, the liturgies and prayer books, the Reform |
| `texts_fathers.py` | Specs for the Church Fathers volumes the Library did not yet have: A Select Library of the Nicene and Post-Nicene Fathers (series 1 and 2, ed |
| `texts_figures.py` | Pictures from the original editions of the library's texts |
| `texts_freedom.py` | Texts on freedom of conscience: arguments, statutes and declarations (the library's "Freedom of conscience" shelf) |
| `texts_gaps2.py` | Specs for a second sweep of the Atlas timeline for religions whose texts the Library still lacked, after the sixth batch (texts_round6.py): the Pearl of Great Price and the first volume of R |
| `texts_gg.py` | Texts from Global Grey ebooks (globalgreyebooks.com), taken from each book's "read online" page: clean typed text in chapters, with footnotes, from public-domain editions |
| `texts_hmuseum.py` | The Hermetic Museum (`h-museum`), the first book of the quality pass: the typed copy of the 1893 edition (the page `texts_gg.py` caches, no name or link kept), cut into its twenty-two tracts, with the printed pages found from two scans of the same edition (the Digital Library of India's and the University of Glasgow's, each lacking pages the other has). `build` writes the text and its index line, `marks` the page marks, `check` reports; `build_texts.py` calls it after the other typed texts, so it overrides the scan spec in `texts_shelf.py` (kept for the scans' addresses). Run `marks` after any rebuild, not `texts_pages.py build`. `tests/hmuseum.test.js` guards it; the numbers and the reasons are in `WHICH_TRANSLATION_PILOT.md` |
| `texts_imagined.py` | The imagined shelf (Library group 'im'): fiction and poetry of the imagination, kept apart from the sources, the history and the graded pages (the maker's rule, ROADMAP.md: "Fiction is its o |
| `texts_lore.py` | Specs for the Library's folklore and witchcraft shelves (Britain and Ireland, Europe, witchcraft and demonology): books from Project Gutenberg (an ident 'PG123' is Gutenberg #123) and scans  |
| `texts_manifest.py` | The first manifest: public-domain texts (mostly Project Gutenberg) mapped to library entries; its `build()` returns the entries, and the other spec modules return the same kind of entry |
| `texts_more.py` | Specs for further open (pre-1931) English translations that fill gaps in the Library: the Sacred Books of the East volumes not yet in, the Puranas, the Pali chronicles and commentaries, the  |
| `texts_originals.py` | Where each library text came from, and the original files its source offers (EPUB, Kindle, PDF of the scan, full text, web page), with sizes |
| `texts_pages.py` | The printed page numbers of the scanned texts: fetch the Internet Archive's page data for each scan, and (build) work out which printed page each paragraph of our text begins on |
| `texts_peoples.py` | Specs for further open (pre-1931) English texts from the peoples of the Americas, the Pacific and Australia: Brinton's translations of Aztec, Maya and Lenape sources, Markham's Inca narrativ |
| `texts_plates.py` | Pictures from the Internet Archive scans of the Library's texts: the plates and figures of the printed book |
| `texts_round10.py` | Specs for a tenth batch of open (pre-1931) English texts: the great Bible and Christian dictionaries (Hastings's Dictionary of the Bible, the Encyclopaedia Biblica, the Dictionaries of Chris |
| `texts_round11.py` | Specs for an eleventh batch of open (pre-1931) English texts, begun on the maker's words "feel free to keep collecting |
| `texts_round12.py` | Specs for a twelfth batch of open (pre-1931) English texts, found by an assessment of the Atlas against the Library (what religions, offshoots and peoples had no readable example): the offsh |
| `texts_round13.py` | Specs for a thirteenth batch of open (pre-1931) English texts: more field records for the peoples the Atlas lists and the Library did not yet read, chosen from the assessment of 16 November  |
| `texts_round14.py` | Specs for a fourteenth batch of open (pre-1931) English texts, on the maker's "yes, round 14", aimed at the thinnest families in the assessment of 16 November 2026 (COVERAGE_ASSESSMENT.md):  |
| `texts_round15.py` | Specs for a fifteenth batch of open (pre-1931) English texts, on the maker's "yes, round 15" (and "don't be afraid to continue on your own |
| `texts_round16.py` | Specs for a sixteenth batch of open (pre-1931) English texts, begun on the maker's words "don't be afraid to continue on your own |
| `texts_round17.py` | Specs for a seventeenth batch of open (pre-1931) English texts, continuing the maker's "get as close as we can to covering all the religions" (17 November 2026): the sects and village religi |
| `texts_round18.py` | Specs for an eighteenth batch of open (pre-1931) English texts (17 November 2026), continuing the maker's "get as close as we can to covering all the religions": the religions of China and K |
| `texts_round19.py` | Specs for a nineteenth batch of open (pre-1931) English texts (17 November 2026), continuing the maker's "get as close as we can to covering all the religions": the movements the assessment  |
| `texts_round20.py` | Specs for a twentieth batch of open (pre-1931) English texts (17 November 2026), continuing the maker's "get as close as we can to covering all the religions": the heterodox Muslim communiti |
| `texts_round21.py` | Specs for a twenty-first batch of open (pre-1931) English texts (17 November 2026), continuing the maker's "get as close as we can to covering all the religions" and aimed at the traditions  |
| `texts_round22.py` | Specs for a twenty-second batch of open (pre-1931) English texts (17 November 2026): the outsiders’ records of the ceremonies, societies and sacred songs of living peoples, on the maker’s in |
| `texts_round23.py` | Specs for a twenty-third batch of open (pre-1931) English texts (17 November 2026): the rituals, the exposures of secret rites and the books of initiatory and esoteric orders that earlier as |
| `texts_round24.py` | Specs for a twenty-fourth batch of open (pre-1931) English texts (19 November 2026), the maker’s “alright approved” on round 24 of COLLECTION_PLAN.md: the canons and the catalogue’s promises (the Mishnah in part, Mishcat-ul-Masabih, the Hedaya, the Harivamsha, thirty minor Upanishads, the Senkessar, Förstemann on the Dresden Codex, Iqbal, Averroes, the Tantras and Hatha yoga texts, the Pali chronicles, the Jain Angas, Legge’s She King and Tso Chuen, and more): 35 texts built, 30 from Internet Archive scans (only the OCR text file of each was fetched) and 5 from Project Gutenberg (through the gutenberg.pglaf.org mirror); of the plan’s 40, one is held (a general history) and four are not built (a Sanskrit-only scan, an in-copyright translation, a scan that repeats e-tgo, a Prakrit edition without a translation): COLLECTION_PLAN.md, section 8. Each spec says what its title page showed; helpers `marks()` (sections cut at named headings) and the per-text sectioners are in the module. Merged into texts_archive.SPECS |
| `texts_round25c.py` | Specs for round 25c of the collection (23 November 2026), built on the maker’s “Fetch now”: thirty Internet Archive scans and Project Gutenberg 8605 on the Universalists and Unitarians (the denomination’s founders, books and histories, the Unitarian side, and the doctrine of the restoration of all argued outside the churches), the helpers `chaptered`, `titled` and `numfix` for printed contents lists and running heads, and `build()` for one more text, the Winchester Profession (the documents only, from a typed page of Schaff’s Creeds of Christendom cached in `cache/ccel/`). Merged into `texts_archive.SPECS` (see the end of that file) and registered in `build_texts.py` for its `build()`; the offline driver and the fetcher are in the notes folder (`round25c-scripts/`). |
| `texts_round25.py` | Specs for rounds 25, 25b and 26 of the collection (24 November 2026), built on the maker’s “Fetch all”: the Samaritans (Gaster’s Asatir and two studies), Isaac of Nineveh, the Tale of Igor, the Irish Dindshenchas, Abbott’s Tukaram and Eknath, Emerson and Thoreau, the Ranter Coppe, the Jain volumes of the Sacred Books of the Jainas, Sayce, Schrader and Buck on the old Near East and Italy, four Bureau of American Ethnology bulletins, the Hermetic books, the missing Nicene volume 7, and the 26 volumes of the Journal of Discourses (one text each, cut into discourses by their running heads: `_jod_sections`). It reuses `chaptered`, `titled` and `marks` from the earlier rounds and adds `after_marks`, `english_only` (drops the lines that are not English) and `rough` (says in a note what the OCR does). Two rows of the look-up were dropped after the scans were read (Wenzel’s Suhrllekha is a German article; the scan of Stcherbatsky’s Nirvana is a later edited edition). Registered at the end of `texts_archive.py`. |
| `texts_round6.py` | Specs for a sixth batch of open (pre-1931) English texts: modern and revival movements (Latter-day Saints, Christian Science, Adventists, Swedenborg, Quakers, Spiritism, the Holy Piby), medi |
| `texts_round8.py` | Specs for an eighth batch of open (pre-1931) English texts: American revival and New Thought writings, Quietist and mystical works of the later Middle Ages and the 17th century, Anglican, Pu |
| `texts_round9.py` | Specs for a ninth batch of open (pre-1931) English texts: the classics of the scholarly study of religion, which the Library's "Scholarship and study aids" shelf had only as modern books it  |
| `texts_shelf.py` | Specs for the Library's six shelves (Hermetic and alchemical, ceremonial magic, Spiritualism and Theosophy, Freemasonry, Siberia and the Arctic, tribal field records): scans from the Interne |
| `texts_sutta.py` | The Pali Canon in English: Bhikkhu Sujato’s translations from SuttaCentral (bilara-data), released under CC0 (public domain dedication) |
| `texts_talmud.py` | Specs for the Talmud tractates of Rodkinson's New Edition of the Babylonian Talmud (1896–1903), the one long English translation in the public domain, cut from its Internet Archive scans |

## Data files

| File | What it holds |
|---|---|
| `atlas_text_aliases.json` | Atlas text record id → Library id (or a list of them), checked by hand, for records whose titles differ from the Library's so the title matcher cannot see them (24 added on 18 November 2026, found by comparing every Library text that nothing in the Atlas pointed at with the records that had no match; the notes in the file say which cover only part of a work) |
| `library_about.json` | For each tradition, the Library books that are about it (studies, histories): read by build_atlas.py into the tradition page |
| `library_lore.json` | For each tradition, the Library books of its stories and customs (folklore): read by build_atlas.py |
| `release_packs.json` | Every Library collection as a pack (short name, collection, optional or not): read by make_release.py, make_site.py and the tests |
| `release_stamp.json` | The day the release stamp last changed (kept so building again on another day gives the same stamp): written by build.py |
| `similar_include.json` | The books of the groups Find similar only partly takes (early Christian, modern movements) that are put in |
| `similar_skip.json` | Books left out of Find similar, by id or pattern, each with the reason (editions of one work, study aids, modern authors' own books, devotional biography, two small texts held back on 17 November) |

## Find similar after rounds 24 to 26 (24 November 2026)

The index of 17 November held 419 texts and 296,059 passages. Rounds 24, 25c, 25, 25b and 26 added 35 texts in groups the index takes (33,942 passages); a plain rebuild came to 454 texts and 330,001 passages, which three files of under 25 MiB cannot hold. All figures below were measured on 24 November in scratch builds (`--out`); nothing was fetched.

**Result.** 445 texts, 319,867 passages, 45,223 words, in seven files of 66.3 MB (61.5 MB before): `chunks.js` 16.5 MiB (the small fields and the term weights), `chunks-2.js` and `chunks-4.js` 13.0 MiB each (the two halves of the passage vectors), `chunks-3.js` 15.9 (the term columns), `terms.js` 3.9, `index.js` 0.7, `motifs.js` 0.2. 26 of the 35 new texts are in (23,808 passages); nine are left out (10,134); no text that was already in was dropped.

**Left out** (each reason in full in `similar_skip.json`; all nine stay in the Library, in text search and in the Atlas). The first three rows are the standing rule (the index compares a tradition's own writings: no modern author's book, scholar's study or devotional biography); the fourth is that rule plus a measurement.

| Ids | Passages | What they are | Measured with all 35 in (560 test searches, 10,844 cards shown; the benchmark's 760 best-ten places) |
|---|---|---|---|
| `x-tuk`, `x-ekn` | 1,470 | Mahipati's lives of the saints Tukaram and Eknath, in Abbott's translations | shown 3 times: left out for what they are |
| `x-sat`, `x-pot`, `x-rmr`, `x-asr` | 5,763 | a modern author's own book: Dayananda's Satyarth Prakash (1875), the Principles of Tantra (Tantratattva, 1866; Avalon's English 1914 to 1916), Rammohun Roy's English works (1820s), Iqbal's Secrets of the Self (1915) | 89 cards (0.8%) and 14 best-ten places (x-sat 10) for 1.7% of the passages: no crowding, left out for what they are |
| `x-ibn`, `x-dre` | 916 | a scholar's study of a work: Khaja Khan's synopsis of Ibn Arabi's Fusus (1928), Förstemann's commentary on the Dresden Codex (1906) | `x-dre` 52 cards, 3.9 times its share of the passages |
| `e-syn` | 1,985 | the Senkessar, the Ethiopian Church's book of the saints for each day (Budge) | in the trial with it in and the other eight out: shown on 149 of 560 searches (27%; 140 with all 35 in), 185 of the 1,093 cards of the Africa, Americas and Pacific collection (17%), 13 best-ten places (9 with all 35 in), the most of any new book: lives of saints that quote the Bible, answering Bible-like searches in that collection's place |

**In** (26): the Hedaya, the Ch'un Ts'ew with the Tso Chuen, Mishcat-ul-Masabih, the Mishnah treatises (`e-mis`), the She King, the Harivamsha, the Thirty Minor Upanishads, the Visuddhimagga part 2, the Culavamsa (two parts), the Bustan, Pseudo-Philo, the Asatir, Averroes, Albo's Ikkarim, the Udanavarga, Rockhill's Life of the Buddha, the Manual of a Mystic, the Dindshenchas, three Jain texts (`x-ant`, `x-jn1`, `x-tat`), Hymns to the Goddess, the Verses of Vemana and the two yoga manuals (`x-ssm`, `x-gsm`). They hold 7.4% of the passages and took 4.8% of the cards and 6.2% of the best-ten places in the 560 test searches (4.3% of the benchmark's 760): no crowding. Above their share, all small books that are often the closest match for their subject: Averroes (4.1 times the share of passages in cards), the Bustan (2.4), Albo and Pseudo-Philo (2.7 and 2.9 in best-ten places). 60% of the pages show at least one of them (0.93 cards a page of 19.3).

**Why a fourth file and not three files and a cut.** Three files hold at most about 307,000 passages: the vectors are 64 bytes a passage, 85 in base64, so `chunks-2.js` reaches 25 MiB (26,214,400 bytes) at 307,200. That left room for 11,100 more than the 296,059 of 17 November; the 26 books carry 23,808, so at least 12,700 of them would have had to go: the five largest, the Hedaya (4,729), the Ch'un Ts'ew with the Tso Chuen (3,985), Mishcat-ul-Masabih (2,645), the Visuddhimagga part 2 (1,169) and the Mishnah treatises (979), which are the canons that round 24 was made to add. No existing text was a candidate to drop instead. So `split_similar.py` now writes four files, each far from the limit (about 480,000 passages fit before `chunks.js` passes 25 MiB), and `build_similar.js` exits 1 if any file is 25 MiB or more. The page joins the halves (`simJoin` in `2w-similar-core.js`) and refuses vectors that stop short of the passages ("incomplete", then a retry works). The halves are `q1` and `q2`, not `q`: a page built before this change looks for `q`, finds none and says the index is incomplete, instead of searching half of it. **The page must be rebuilt (`python3 build.py`) when this index is installed**; until then the old page shows "Could not compare" on Find similar. Checked in a private preview: all four chunk files load, the examples answer, a missing `chunks-4.js` gives the message and not wrong results, and putting the file back and trying again works.

**The benchmark** (76 cross-tradition questions; it moves by 2 or 3 questions and 0.04 of reciprocal rank when one book is added or left out, so it is read as "nothing fell", not as an improvement):

| Index | Texts | Passages | Shown | Ten-best | Top 25 | MRR |
|---|---|---|---|---|---|---|
| installed on 17 November | 419 | 296,059 | 17 (22%) | 11 (14%) | 22 (29%) | 0.062 |
| trial: all 35 in | 454 | 330,001 | 19 (25%) | 12 (16%) | 18 (24%) | 0.069 |
| trial: the eight rule texts out, the Senkessar in | 446 | 321,852 | 16 (21%) | 11 (14%) | 18 (24%) | 0.052 |
| **installed now** | 445 | 319,867 | 16 (21%) | 14 (18%) | 19 (25%) | 0.064 |
| installed now, asked as if the 26 new books were not there (`--leave`) | | | 16 | 14 | 19 | 0.067 |

The curated pairs shown went from 17 to 16: Plato's last words to Luke and the Gospel of Nicodemus to Virgil are no longer shown and 1 Corinthians to the Didache is; asking as if the 26 new books were not there shows exactly the same 16, so no new book took their places: it is the re-fit of the 64 dimensions, as on 17 November.

**The Noah gate changed.** `tests/similar.test.js` failed its "Noah and the ark: Gilgamesh XI is the closest in the Near East" check on all three trial builds (454, 446 and 445 texts) and had passed on the 17 November index by 0.03 (Gilgamesh XI second among the Near East sections at 7.50, Harper's Assyrian and Babylonian Literature third at 7.47). The cause was in the test: its first searches ran without the motif bonus (`simMotifScores` was set only in the motifs block at the end) that the page always adds. Without it Gilgamesh XI's best section ranked 100th of 2,139 sections on the 17 November index and 174th, 131st and 175th on the three trials; with it (what the page does) it ranks 23rd (the dove: 12th) on the old index and 18th, 22nd and 27th (11th, 13th, 8th) on the trials, shown first or second among the Near East sections every time. The test now sets the motif scorer first, as `similar_bench.js` always did, and passes on the old and the new index; it also checks that no file is 25 MiB or more, that the vectors are whole and that the two-part join works (47 checks, 42 before). The old motif-free search can be reproduced by leaving `globalThis.simMotifScores` unset; the project manager or the maker may want a different gate.

**Open.** `x-elb` and `x-mir` (296 passages) are still left out: the reason recorded on 17 November was this gate, which no longer holds; Taylor's Eleusinian and Bacchic Mysteries is a modern study and Mead's Mithriac Ritual a translation of the Mithras Liturgy with his commentary, so the decision is the same kind as above and was not made here. The previous index is kept as an APFS clone at `side-session-notes/local_70623f3a-91cf-4ff5-a5e1-a417d4fdb3b5/similar-before-24nov-rollback` (the build is also deterministic: skip the 35 ids and rebuild). Not touched, for the project manager's integration: the release note in `src/js/2z-data-methods.js` ("Find similar still searches the 419 texts it was built on") and the `similar/` figures in `DISTRIBUTION.md` (62 MB, three files, 419 texts).

**To repeat.** `node tools/build_similar.js --stats --per-text --out <scratch>` counts passages per book (90 s); `node tools/build_similar.js --out <scratch>` builds without installing (2.5 minutes, 2 GB); `node tools/similar_bench.js --quiet --dir <scratch> --crowd ids.json --by-book` and `--leave ids.json` judge a set of books; install with `rsync -a <scratch>/ ../similar/`, then `python3 build.py` and the whole suite.
