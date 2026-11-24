# Collection plan: the last rounds before the freeze (rounds 24 onward)

Written 18 November 2026 by a child session for the project manager, for the maker's decision, before the quality pass (`ROADMAP.md`, "The quality pass"). **Nothing was downloaded, built or changed in the project.** The only files written are this one and `COLLECTION_NEXT.csv` (615 rows: one per candidate text, per tradition with no example, per catalogue entry with no file, per poor edition, and so on; the `row_type` column says which).

What I read, one request at a time, six seconds apart: 220 public pages (209 search and record pages at the Internet Archive; three version lists at Sefaria; three GitHub listings; one size check on HathiTrust; one page each at Oxford's ETCSL and at ORACC). Two answers stopped me: **Project Gutenberg's site answered my first request with 503 and `Retry-After: 3600`, so I stopped asking it for the whole session** (its sizes below are estimates, or come from the Archive's copies of Gutenberg texts); and one Sacred Texts page answered 403 and was not retried (the session that swapped the Hermetic Museum, `lamplighter-hermetic-swap`, met the same refusal four times). No file was saved except my own scratch notes.

## Summary

**The three biggest gaps**

1. **What the law keeps out.** The Library cannot hold what was first published after 1930 or found after 1945. That is 79 of the 263 traditions with no example (movements whose own scriptures are in copyright), 28 Dead Sea Scrolls entries and 10 Nag Hammadi entries with no file, the Ugaritic, Hittite and Coffin Texts, and Bukhari and Muslim in English. Four doors are open and none is a download of someone else's copyright: the date (1931 books are free in the United States on **1 January 2027**, 44 days away), a renewal check (a 2.2 MB public file), openly licensed translations (Sefaria's Mishnah, ETCSL), and United States government publications (Bunzel's Zuni volume, Densmore, Swanton).
2. **The great canons of the rabbinic, Islamic and Indic traditions.** Sunni Islam (84 Atlas records with no file), Rabbinic Judaism (74), Hinduism (55) and Christianity (50) are the largest holes by count. Round 24 puts in the most valuable clean public-domain translations from these (the Mishnah in part, the one complete hadith book, the Hedaya, the Harivamsha, thirty minor Upanishads, six Tantras and Samhitas, the Jain Angas, the Ethiopian Synaxarium); round 27 would add the whole Mishnah and the whole Talmud under open licences.
3. **The oldest Near Eastern literature.** Sumerian (42 Atlas records, 2 readable), Hittite (12, 0), Babylonian and Assyrian (33, 9) and Egyptian (44, 17) have only Langdon, Budge and Breasted. The one free modern source of Sumerian is ETCSL (CC BY-NC-SA); it needs the maker's yes on open licences (decision D1).

A fourth gap is not a gap in coverage but in quality: **57 scans score under 0.80 or have 15% damaged sections** (the Hermetic Museum the maker named is already done: another session swapped it to a typed copy, `WHICH_TRANSLATION_PILOT.md`), and 3 of the 12 Global Grey texts still have no public edition. Those go to the quality pass (round 28), and I give them a named better source where I found one (22 of the 57).

**First batch for approval: round 24.** 40 texts, **44.9 MB** of text: 35.8 MB read from the Archive's own file records and 9.1 MB estimated (the Harivamsha and Averroes, which are on Gutenberg; Ibn Arabi, not yet sized; and the second volumes of the Mishkat, of Rammohun Roy and of the Senkessar). 34 are Internet Archive scans (OCR text, taken the way the builders already take them) and 6 are typed Gutenberg texts. All are public domain in the United States by date. The list, with sizes, is in section 4. Adding it, regenerating `downloads/` and rebuilding the zips takes about 0.34 GB of disk (0.20 GB without the zips).

**Two things the Atlas does not show.** (a) The Library holds more than the Atlas knows: 8 of the 115 catalogue entries with no file and 6 of the 263 traditions with no example are already covered by a book the Library holds (the Memphite Theology and the Aten hymn are in Breasted 1912, the Merneptah stele in Ancient Records of Egypt, Huarochiri in Markham 1873, the Chilam Balam in Brinton's Maya Chronicles, Sulod religion in the Blair and Robertson volume), so a mapping pass costs no disk. (b) Several things earlier notes called missing are on Project Gutenberg or already in: the Harivamsha (Gutenberg 61937), Jaina Sutras part II (the Library's `x-sut` is already all of SBE 45), Langdon's Tammuz and Ishtar (`x-tam`).

## 1. What "complete" should mean: measurable targets

Numbers are recomputed from the files today (`atlas/`, `texts/`, `tools/library_about.json`), with a read-only copy of `tools/assess_coverage.py` that wrote to my scratch folder.

| # | Target | Today | After rounds 24 to 27 and the mapping pass |
|---|---|---|---|
| T1 | Every one of the 793 Atlas traditions has a readable text or example, or is read through its parent's text, or has **one recorded reason** | 530 (67%) have an example of either kind; 141 (18%) have a text of their own; 84 more are read through their parent. **No code is recorded for the other 179.** | 547 (69%) have an example (11 filled, 6 mapped); 549 with the January 2027 books; **all 793 carry a code** (this CSV gives one to each of the 263) |
| T2 | Every one of the 1,528 catalogue entries has a file or a recorded reason | 1,413 have a file (92.5%); 115 do not and none has a stated reason in one place | 8 get a file, 8 are mapped to a text the Library holds, 99 carry a reason: 53 no public-domain text, 28 modern books listed by design, 10 renewal checks, 4 to check, 2 dated, 1 no scan, 1 rights (the CSV's `entry` rows) |
| T3 | Every major scripture has a hosted public-domain (or open-licence) translation | On the 24 scripture shelves 660 of 746 entries have a file (88.5%); 86 do not | 668 of 746 (89.5%) plus the 8 mapped; the works that cannot be held are named below with their reason |
| T4 | Every work held only in a poor edition is noted | The audit lists 55 scans under 0.80 but gives no better source | 57 rows in the CSV (the Hermetic Museum is done and is the 58th), each with a named better source (22) or "find a better scan" (35) |
| T5 | The twelve Global Grey texts each have a public edition link | 82 of 94 | 9 of 12 now have one (below); 3 do not |
| T6 | Every label says what the text's status rests on | e-ben says only "text from Project Gutenberg" | e-ben relabelled and a pre-1931 second translation beside it |
| T7 | The 18 renewal candidates are checked, and every dated book is on a list | Not checked | One 2.2 MB file; a dated list to 2030 (section 2.7) |
| T8 | The collection is stamped and frozen | Not frozen | After round 27, the January 2027 round and the renewal check: the freeze (decision D9) |

## 2. The gaps, ranked by value to a student of religion

### 2.1 The 263 traditions with no example, by reason

Computed from the Atlas and the Library, then classed by rules and by my reading of each (the `checked` column says `D+J`: data, then my judgement; the one I tested against a Library text is Sulod). The full table is the `tradition` rows of the CSV.

| Code | What it means | Traditions |
|---|---|---|
| PARENT | The parent tradition's texts are in the Library; the movement's own are later, in copyright or not open. They count as read through the parent | 84 |
| POST | Its own scriptures were written after 1930 and are in copyright (nearly all founded 1931 or later; listed in `POST1930_WANTED.csv` where catalogued) | 79 |
| LANG | The pre-1931 record is in another language only (French, German, Dutch, Spanish, Portuguese, Chinese, Korean, Vietnamese, Tagalog, Latvian, Polish) | 28 |
| NONE | No public-domain text found in any language by this plan: a short list for one more search session (below) | 20 |
| ORAL | An oral tradition; the only pre-1931 notes are outsiders', not found open, or none exist | 19 |
| FILL | A public-domain source was found: Elamite, Luwian, Kassite, Ammonite, Urartian, Umbrian and Oscan, Chamorro, Kanak, Ranters, Pentecostalism, Mormon fundamentalism (rounds 24 to 26) | 11 |
| PRE | Prehistoric: no written text exists | 9 |
| MAP | The Library already holds a book on it: Donyi-Polo (Dalton), Sulod (Loarca in `a-phil`), Mazu, Three-in-One teaching, Dönmeh (Graetz, Dubnow), Fourth Way (Ouspensky's Tertium Organum) | 6 |
| NOSCAN | A public-domain English edition exists but no open scan was found: Kakure Kirishitan, Parihaka, Ringatu, Vailala Madness | 4 |
| DATE | Free on a known date: Harappan (Marshall 1931), Venda (Stayt 1931), both on 1 January 2027 | 2 |
| RENEW | A renewal check could free its standard book: Reconstructionist Judaism (Kaplan 1934) | 1 |

**NONE, the twenty for one more search:** Nuragic, Way of Great Peace, Shangqing, Lingbao, Zhuang Mo, Dongba, Onmyodo, Magyar paganism, Ryukyuan, Curanderismo, Ukrainian Greek Catholic, Garifuna, Diggers, Strangite Latter Day Saints, the Xhosa cattle-killing, Black Hebrew Israelites, Mumboism, Oneness Pentecostalism, Branch Davidians, Rodnovery. Some have a likely source I could not open (Winstanley's tracts, Strang's Book of the Law of the Lord, Houteff's Shepherd's Rod of 1930, Hobley 1929, Young 1795).

### 2.2 The major scriptures and key works, ranked

Rank is my judgement of value to a student; "round" says where the plan puts it.

| Rank | Work | In the Library today | Public-domain or open source | Round |
|---|---|---|---|---|
| 1 | The Mishnah and the Talmud | tractate Avot; 24 Talmud tractates (Rodkinson 1896-1903) | De Sola and Raphall, 18 tractates (1843); the whole Mishnah in English under CC-BY (Kulp; Silverstein) and the whole Talmud under CC-BY-NC (William Davidson), both read on Sefaria's own records; Danby 1933 free in 2029 | 24, 27 |
| 2 | Hadith | none | Matthews, Mishkat al-Masabih (1809), the one complete collection; Bukhari and Muslim in English are all in copyright | 24 |
| 3 | Sunni law and creed | none (84 records) | Hamilton, the Hedaya (1791); Baillie's Digest of Muhammadan Law (1865) is on the Archive | 24, 26 |
| 4 | Hindu: Puranas, Tantras, minor Upanishads | 8 of the 18 Puranas; the Mahanirvana Tantra; 13 Upanishads | Harivamsha (Dutt 1897); Thirty Minor Upanishads (1914); Avalon's Kularnava Tantra, Hymns to the Goddess, Principles of Tantra; Woodroffe's Shakti and Shakta; Schrader on the Pancaratra; the other ten Puranas are after 1930 | 24 |
| 5 | Pali Theravada | the four Nikayas, selected Khuddaka books and Brahmali's Vinaya (CC0); Visuddhimagga part I; Abhidhamma 2 of 7 | Culavamsa (Geiger 1929-30); Visuddhimagga part II (1929) now and part III on 1 Jan 2027; the other five Abhidhamma books are in copyright | 24, Jan 2027 |
| 6 | Jain canon | Acaranga, Kalpa, Uttaradhyayana and Sutrakritanga (`x-sut`), Samayasara, Gommatasara | Antagada and Anuttarovavaiya (1907); Uvasagadasao; Tattvartha Sutra (1920) | 24, 26 |
| 7 | The Sumerian corpus | Langdon's four books | ETCSL, about 400 compositions, CC BY-NC-SA; nothing else is free | 27 (decision) |
| 8 | Ethiopian and Coptic church books | Kebra Nagast; Miracles of Mary; saints' lives | The Senkessar (Budge 1928); History of the Patriarchs (Evetts 1904); Coptic Apocrypha (Budge 1913) | 24 |
| 9 | The Chinese and Japanese classics | Analects, Mencius, Changes, Rites, parts of Documents and Songs | The whole Book of Songs and the Zuo Zhuan (Legge 1871-72); Kojiki (Chamberlain, typed at Sacred Texts) | 24, 25 |
| 10 | Sufism | Rumi, Attar, Hujwiri, Gulistan | Ibn Arabi (Khan 1928, the catalogue promises it); Sa'di's Bustan; Iqbal's Secrets of the Self | 24 |
| 11 | The Maya books | Popol Vuh, Annals of the Cakchiquels, Maya Chronicles | Foerstemann on the Dresden Codex (1906); Chilam Balam is already inside the Maya Chronicles | 24 |
| 12 | Hawaiian, Japanese, Philippine origins | none | Kumulipo (Liliuokalani 1897, typed); Saleeby on the Sulu and Maguindanao codes (1905-08) | 24, 25 |
| 13 | Ancient Near East histories | Hittite, Elamite, Urartian, Kassite, Luwian: none | Cambridge Ancient History volumes I to VIII (1923-30; identifiers still to find) | 26 |
| 14 | The Dead Sea Scrolls (28 entries), Nag Hammadi (10) | the Damascus Document only | **None.** Translations are after 1945; Burrows 1950-51 and the early US Nag Hammadi editions are renewal candidates | check |

**Works that cannot be held, and why:** all 28 Qumran entries but the Damascus Document; the 10 Nag Hammadi texts; Ugaritic (Baal Cycle, Kirta, Aqhat), found 1929, English after 1930; the Coffin Texts and Pyramid Texts (Mercer 1952 is a renewal candidate; Allen 2005 carries a no-derivatives licence); Hittite texts (ANET 1950); Avatamsaka, Vimalakirti, the Prajnaparamita and the Kangyur and Tengyur (modern translations; 84000 carries a no-derivatives licence, the same case as the Bahai files); Huainanzi (1933, free 2029) and the Huangdi Neijing (Veith 1949, a renewal candidate); the four later Abhidhamma books; ten Puranas; Meqabyan; the Philokalia; Evagrius; Kephalaia and the Manichaean Psalms; Hadith of Bukhari and Muslim; the Soncino Zohar (volumes 1-2 free in 2027, the rest to 2030) and Soncino Talmud (1935-52, free from 2031); Danby's Mishnah (free 2029). The "Library entry, no file" catalogue lines for modern scholarship (28 `z-` entries) are books in copyright by design.

### 2.3 Works held only in a poor edition

The audit's dictionary score counts non-words, so it misses a scan with single-letter errors such as the Hermetic Museum's "z¢s earth" (now mended by another session), and it penalises Sanskrit and cuneiform. Of 1,019 scans: 11 score under 0.70, 55 under 0.80, 114 under 0.85, 292 under 0.90; 13 have 15% or more damaged sections. The CSV lists 58 `replace` rows (the 55, the extra damaged ones, and the Hermetic Museum marked `done`), ranked, with the better source I found:

* **Typed editions at Sacred Texts** (Callaway's Religious System of the Amazulu at `afr/rsa/`, read in a search result; the Hermetic Museum's typed edition is there too): the best fix in principle, but Sacred Texts answered 403 to me and to the Hermetic Museum session, so it needs its bulk licence or a hand download (decision D2). Probable but unread: Arda Viraf, Hatha Yoga Pradipika, Narada Bhakti Sutras, Vedic Hymns (SBE 32), Carmina Gadelica, Bleek's Bushman Folklore.
* **The Hermetic Museum is done:** `h-museum` is now a typed copy of Waite 1893 with page marks from two scans (the University of Glasgow's `b24927363_0001` and `_0002` and the Digital Library of India scan, each missing some pages), so the pilot for Q1 exists; about 110 likely typing slips are listed for the corrections layer.
* **Typed elsewhere:** Early Jewish Writings (Ascension of Isaiah, Testament of Moses, 4 Baruch), CCEL (Creeds of Christendom), Esoteric Archives (Dee's True and Faithful Relation, the Heptameron, the Fourth Book, the Fama and the Chymical Wedding).
* **A modern open translation:** the Gudea cylinders and the Babylonian psalms (ETCSL), Thompson's Reports of the Magicians and Astrologers (ORACC SAAo).
* **No fix without a better scan:** the other 35. The quality pass's Q1 does these.

### 2.4 The twelve Global Grey texts with no public edition link

I took each text's opening and compared it with the Archive and Gutenberg.

| Id | Text | Public edition found | Where |
|---|---|---|---|
| `h-open` | Philalethes, Open Entrance to the Closed Palace of the King | Yes, and the Library already has it | Waite, *The Hermetic Museum* volume 2 (1893): `h-museum` holds the same preface ("being an anonymous adept, a lover of learning") and is now itself a typed copy; the Global Grey text repeats that tract and the swap session already notes it for the Find similar index |
| `v-doyle` | Doyle, History of Spiritualism | Yes | Archive `historyofspiritu015638mbp` (vol. I) and `in.ernet.dli.2015.218497` (vol. II), Cassell 1926 |
| `a-balo` | Malinowski, Baloma | Yes (typed) | `archive.sacred-texts.com/pac/baloma/bal00.htm` (JRAI 46, 1916); no scan on the Archive |
| `l-robi` | Roby, Traditions of Lancashire | Yes | Gutenberg 15271 and 25256 |
| `l-camp` | Campbell, Popular Tales of the West Highlands | Yes | Archive `populartalesofwe01campuoft`, `populartalesofw02campuoft`, `populartalesofwe03campuoft` (1890-93 revised edition) |
| `l-bott` | Bottrell, Traditions and Hearthside Stories of West Cornwall | Second series only | Archive `traditionshearth00bottiala` (1873) and Gutenberg 41761; the first series (1870) not found |
| `l-rhys` | Rhys, Celtic Folklore | Yes | Archive `celticfolklorewe01rhys`, `celticfolklorewe02rhys` (1901) |
| `l-greg` | Lady Gregory, Visions and Beliefs | Yes | Gutenberg 43973 and 43974 (first and second series) |
| `w-vamp` | Summers, The Vampire: His Kith and Kin | Yes | Archive `TheVampireSummers` (1928) |
| `m-pull` | The Black Pullet | **No** | Only modern re-typings on the Archive; no pre-1931 printed English edition found |
| `m-grand` | The Grand Grimoire | **No** | The Archive's English copies have no stated edition |
| `a-wins` | Winstedt, Shaman, Saiva and Sufi (1925) | **No open scan** | The Archive has only the 1951 and 1982 revised editions (lending); HathiTrust may hold the 1925 Constable edition |

### 2.5 The Rule of Benedict

`e-ben` is Doyle's *St. Benedict's Rule for Monasteries* (Liturgical Press, Collegeville, 1948), Gutenberg 50040, labelled "Public domain (text from Project Gutenberg)". It is not public domain by its date: as the brief puts it, Gutenberg's clearance rests on the book's United States copyright not having been renewed, and the translator's rights may still run outside the United States. I could not open Gutenberg's page to read the clearance (the 503). Recommendation, in the spirit of "explain, don't remove": keep the text and change the licence line to say "Public domain in the United States because the 1948 copyright was not renewed (Project Gutenberg's clearance); not by date", and add a pre-1931 translation beside it so the Library has one that rests on its date alone: **O. Hunter Blair, Fort Augustus** (the Archive's `ruleofstbenedict0000unse_h4o5` is the 1914 edition). A 1906 copy (`ruleofstbenedict00bene_1`) and a 1907 edition "with an English translation" (`TheRuleOfStBenedict`) are also there; their translators are to confirm on the title pages. Delatte's 1921 commentary is `ruleofstbenedic00delauoft`. It is in round 25.

### 2.6 The 18 post-1930 candidates and the renewal check

The 18 rows marked "candidate for public domain by non-renewal" in `POST1930_WANTED.csv` (Heschel's *The Sabbath* and *God in Search of Man*, Kaplan's *Judaism as a Civilization*, Hurston's *Tell My Horse* and *Mules and Men*, Deren, Tallant, Parsons's *Hopi Journal of Alexander Stephen*, *The Sacred Pipe*, Kluckhohn and Leighton, Reichard's *Navaho Religion*, Bunzel's *Zuni*, Ouspensky, Gurdjieff, Ballard, Meher Baba, Norman, the first *Humanist Manifesto*). A US book first published 1931-1963 is free only if its copyright was not renewed 28 years later, so the question is one lookup per title. **Bunzel's volume is a government report of the Bureau of American Ethnology, so it is public domain whatever the renewal, and it is in round 25.** Of the 149 rows first published 1931-1963, 33 name a United States publisher; the CSV also lists 11 more titles I know of (Burrows's Dead Sea Scrolls 1950, Mercer's Pyramid Texts 1952, Veith's Neijing 1949, the Florentine Codex 1950-82, Roys's Chilam Balam 1933, Torrey's Lives of the Prophets 1946, the first US Nag Hammadi editions 1959-61, Tschan's Helmold 1935).

What the check would take, from the three routes I could size:

| Route | Size | What it is |
|---|---|---|
| HathiTrust `CRMSRenewals.tsv` (from the Stanford Copyright Renewal Database) | **2.2 MB** (size read by HEAD request) | One file; a script checks every title in minutes. Recommended |
| NYPL `cce-renewals` on GitHub (CC0) | 111 MB for 1950-2001; **96 MB** for the renewal years 1959-1992 that matter (47 files, read from the repository's listing) | The fuller source |
| Per-title searches at the Stanford database | about 60 small pages | No file, 6 minutes at the polite pace |

I would keep the file in my scratch folder, never in the project, and delete it after. This is decision D3.

### 2.7 Dated opportunities

The 1931 books enter the United States public domain on **1 January 2027** (95 years from publication, including books first published abroad). The CSV lists 15 dated rows through 2030. The first eight are: *The Secret of the Golden Flower* (Wilhelm and Jung, trans. Baynes, 1931), Marshall's *Mohenjo-daro and the Indus Civilization*, Stayt's *The BaVenda*, Ouspensky's *A New Model of the Universe*, the *Path of Purity* part III (on the Archive as `in.gov.ignca.9223`), Rhys Davids's *Minor Anthologies* part I, the *Niyamasara*, and the Soncino *Zohar* volumes 1-2. Sefaria calls the Soncino Zohar "Public Domain", which is its reading of Israeli law; the United States date is 2027 to 2030. Confirm each year of first publication before building. 1932 on 1 January 2028 (Black Elk Speaks, The Dawn-Breakers); 1933 on 1 January 2029 (Danby's Mishnah, Morgan's Huainanzi).

### 2.8 A cheap step first: map before you fetch

Of the 2,307 Atlas text records, 525 are readable here (23%) by the title matcher. Of the 1,495 records of works first dated before 1931 that are not marked as held, many are inside books the Library already has (I searched the text for six of the catalogue entries without a file: all six were already inside Library books). A second matching pass, by a session with no downloads, will turn some hundreds of "missing" records into links and shrink the real gap list before round 25.

## 3. Sources, and whether the builders can take them as they are

| Source | Format | Rights | Builders | Used in |
|---|---|---|---|---|
| Internet Archive (OCR of scans, `_djvu.txt`) | OCR text, sliced and cleaned | Public domain by date; each row's record was read | **Yes**: `texts_*.py` spec with identifiers (as `texts_round23.py`); `cut_head` / `cut_tail` | 34 of round 24 |
| Archive copies of Digital Library of India and Motilal reprints (`in.ernet.dli.*`, `mlbd.*`) | OCR text | Public domain originals; check reprint front matter | **Yes**, used before | many |
| Project Gutenberg | typed text | Public domain in the US | **Yes** (the pglaf mirror; "PG123" idents) | 6 of round 24 |
| Sacred Texts (typed) | one HTML page per chapter | Public domain texts; its notice must stay; bulk robotic copying is a stated violation; it licenses the whole archive | **No**: it answered 403 to automated reading (to me and to four requests by another session); needs its bulk licence or a hand download | Kojiki, Kumulipo, Baloma, Hermetic Museum, Callaway |
| Sefaria API | JSON per tractate | per version: CC-BY (Kulp, Silverstein), CC-BY-NC (Davidson), PD (Cohen's Berakot 1921), CC0 (community) | **No**: new fetcher | round 27 |
| ETCSL, ORACC | static HTML | CC BY-NC-SA (ETCSL, by the Oxford Text Archive record); CC BY-SA (ORACC documentation) | **No** | round 27 |
| HathiTrust full view | page images and text | Public domain by date (1930 books now) | **No** | candidates |
| PDF at a library site (Azusa Street 1906-08; Zenodo's Kano Chronicle) | PDF | Public domain | **No**: needs a PDF-to-text step | round 25 |
| SuttaCentral | JSON | CC0 | **Yes** (already used; the Library holds all four Nikayas and Brahmali's Vinaya) | nothing left |
| 84000, SBL open volumes, the Bahai files | PDF, EPUB | Free to read, **no derivatives** | **Cannot be taken**: sectioning is a change | none |

## 4. The rounds

Each round names its files, sources and sizes. The size is the text the builder reads (the OCR or typed text), not the scan: the scans behind these run from 0.5 to 760 MB of images and are not fetched. A builder run needs one request per file and cuts the front and back matter by hand, as in rounds 12 to 23; the maker's earlier rule (state files, sources, sizes before any download) applies to each.

### Round 24: the canons and the catalogue's promises (first batch, ready to approve)

40 texts, 44.9 MB. Read from the Archive's record: 35.8 MB; estimated: 9.1 MB. The "Size basis" column says which ("read" means the size of the OCR or typed text file in the Archive's own record; "part read" means one volume read and the other estimated). Public-domain rights in the CSV, row by row; the title page of the Hedaya, the Uvasagadasao, the Kularnava Tantra, Path of Purity II, the Spanda Karikas and Ibn Arabi has to be read before building (the record's date or editor is uncertain).

| # | id | Work and edition | Source (identifier) | Text size | Size basis | Tier |
|---|---|---|---|---|---|---|
| 1 | `e-mis` | Eighteen Treatises from the Mishna. D. A. de Sola and M. J. Raphall, 1843 | archive: `eighteentreatis00raphgoog` | 0.93 MB | read | 1 |
| 2 | `x-msb` | Mishcat-ul-Masabih, or a Collection of the most Authentic Traditions (Hadith) of Muhammad. Capt. A. N. Matthews, 2 vols, Calcutta 1809-10 | archive: `10219219bsb`, `10219220bsb` | 2.65 MB | part read | 1 |
| 3 | `x-hid` | The Hedaya, or Guide: a Commentary on the Mussulman Laws. Charles Hamilton, 1791; the scan is a later edition (the archive dates it 1963: the title page must be read before building) | archive: `hedayaorguide029357mbp` | 5.10 MB | read | 1 |
| 4 | `x-hvm` | A Prose English Translation of Harivamsha. Manmatha Nath Dutt, 1897 | Gutenberg 61937 | 1.30 MB | estimate | 1 |
| 5 | `x-mnu` | Thirty Minor Upanishads (including the Yoga Upanishads). K. Narayanasvami Aiyar, Madras 1914 | archive: `thirtyminorupani00xxxxuoft` | 0.61 MB | read | 1 |
| 6 | `e-syn` | The Book of the Saints of the Ethiopian Church (the Senkessar). E. A. Wallis Budge, 4 vols, Cambridge 1928 (volumes 1-2 found; 3-4 to find) | archive: `bookofsaintsofet0001unse`, `bookofsaintsofet0002unse` | 3.22 MB | part read | 1 |
| 7 | `x-ibn` | Wisdom of the Prophets (Fusus al-Hikam of Ibn Arabi). Khan Sahib Khaja Khan, Hyderabad 1928 | archive: `wisdomofprophets0000ibna` | 0.35 MB | estimate | 1 |
| 8 | `x-dre` | Commentary on the Maya Manuscript in the Royal Public Library of Dresden. Ernst Foerstemann, translated by S. Wesselhoeft and A. M. Parker, 1906 | Gutenberg 43519 | 0.47 MB | read | 1 |
| 9 | `x-asr` | The Secrets of the Self (Asrar-i Khudi). Muhammad Iqbal, translated by R. A. Nicholson, 1920 | Gutenberg 57317 | 0.15 MB | read | 2 |
| 10 | `x-avr` | The Philosophy and Theology of Averroes. M. J. Mueller and Mohammad Jamil-ur-Rehman, Baroda 1921 | Gutenberg 65708 | 0.35 MB | estimate | 2 |
| 11 | `a-mor` | Studies in Moro History, Law, and Religion. Najeeb M. Saleeby, Manila 1905 | Gutenberg 41770 | 0.28 MB | read | 2 |
| 12 | `a-sul` | The History of Sulu. Najeeb M. Saleeby, Manila 1908 | Gutenberg 41771 | 0.76 MB | read | 2 |
| 13 | `x-spk` | The Spanda Karikas of Vasugupta, with the Vivriti of Ramakantha. Vasugupta, Kashmir Series of Texts and Studies, 1913 (editor and translator named in the catalogue record as J. C. Chatterji: to confirm on the title page) | archive: `thespandakarikas00vasuuoft` | 90 KB | read | 2 |
| 14 | `x-ssm` | The Siva Samhita. Srisa Chandra Vasu, The Siva Samhita (Sacred Books of the Hindus; first printed 1914, this upload undated: to confirm) | archive: `YogaShivaSamhita_201903` | 0.13 MB | read | 2 |
| 15 | `x-gsm` | The Gheranda Samhita. Srisa Chandra Vasu, The Gheranda Samhita (Bombay 1895; Sacred Books of the Hindus 1914; this upload undated: to confirm) | archive: `Gheranda_Samhita` | 97 KB | read | 2 |
| 16 | `x-kul` | Kularnava Tantra. Arthur Avalon (John Woodroffe), Tantrik Texts vol. V, 1917 | archive: `ArthurAvalonKularnavaTantraEng` | 0.20 MB | read | 2 |
| 17 | `x-htg` | Hymns to the Goddess (and Hymn to Kali). Arthur and Ellen Avalon, 1913 | archive: `in.ernet.dli.2015.281515` | 0.28 MB | read | 2 |
| 18 | `x-pot` | Principles of Tantra (Tantratattva). Arthur Avalon, 2 parts, 1914-1916 | archive: `dli.bengal.10689.636` | 2.47 MB | read | 2 |
| 19 | `x-skt` | Shakti and Shakta. John Woodroffe, 1918 (third and later editions to 1929) | archive: `in.ernet.dli.2015.213495` | 0.55 MB | read | 2 |
| 20 | `x-pcr` | Introduction to the Pancaratra and the Ahirbudhnya Samhita. F. Otto Schrader, Adyar 1916 | archive: `introtothepancar00shcruoft` | 0.41 MB | read | 2 |
| 21 | `x-cv1` | The Culavamsa, part I. Wilhelm Geiger, Pali Text Society, 1929 | archive: `in.ernet.dli.2015.277108` | 0.89 MB | read | 2 |
| 22 | `x-cv2` | The Culavamsa, part II. Wilhelm Geiger, Pali Text Society, 1930 | archive: `in.ernet.dli.2015.277099` | 0.87 MB | read | 2 |
| 23 | `x-pp2` | The Path of Purity (Visuddhimagga), part II. Pe Maung Tin, Pali Text Society, 1929 | archive: `in.gov.ignca.9221` | 0.91 MB | read | 2 |
| 24 | `e-ikk` | Sefer ha-Ikkarim, Book of Principles. Joseph Albo, translated by Isaac Husik, Jewish Publication Society, 1929-1930 | archive: `seferhaikkarimbo0000jose` | 0.48 MB | read | 2 |
| 25 | `x-bos` | The Bustan of Sa'di. H. Wilberforce Clarke, 1879 | archive: `bstnbyshaikh00sadiuoft` | 0.78 MB | read | 2 |
| 26 | `x-sat` | An English Translation of the Satyarth Prakash (Light of Truth). Dayananda Sarasvati, translated by Chiranjiva Bharadwaja, Lahore 1908 | archive: `satyarthprakashl00dayauoft` | 2.09 MB | read | 2 |
| 27 | `x-rmr` | The English Works of Raja Rammohun Roy, vols 1-2. Jogendra Chunder Ghose (ed.), Calcutta 1901 | archive: `theenglishworks01rammuoft`, `theenglishworks02rammuoft` | 1.18 MB | part read | 2 |
| 28 | `e-tgn` | The Targums of Onkelos and Jonathan ben Uzziel on the Pentateuch: Genesis and Exodus. J. W. Etheridge, 1862 | archive: `cu31924074296975` | 1.30 MB | read | 2 |
| 29 | `p-psp` | The Biblical Antiquities of Philo (Pseudo-Philo). M. R. James, 1917 | archive: `cu31924063410827` | 0.50 MB | read | 2 |
| 30 | `e-pat` | History of the Patriarchs of the Coptic Church of Alexandria. B. Evetts, Patrologia Orientalis, 1904 | archive: `historyofpatriar0000beve` | 1.25 MB | read | 2 |
| 31 | `x-ant` | The Antagada-dasao and Anuttarovavaiya-dasao. L. D. Barnett, Royal Asiatic Society, 1907 | archive: `antagadadasaoanu00royauoft` | 0.39 MB | read | 2 |
| 32 | `x-uva` | The Uvasagadasao: the Seventh Anga of the Jain Canon. P. L. Vaidya (or A. F. R. Hoernle, 1885) | archive: `in.ernet.dli.2015.282413` | 0.16 MB | read | 2 |
| 33 | `a-loy` | Among the Natives of the Loyalty Group. Emma Hadfield, 1920 | archive: `amongnativesoflo00hadfuoft` | 0.57 MB | read | 2 |
| 34 | `x-she` | The She King; or, The Book of Ancient Poetry. James Legge, The Chinese Classics vol. IV, 1876 reprint | archive: `shekingorbookofa0000unse` | 0.84 MB | read | 2 |
| 35 | `x-cts` | The Ch'un Ts'ew with the Tso Chuen. James Legge, The Chinese Classics vol. V, 1872 | archive: `james-legge-the-chinese-classics-the-chun-tsew-with-the-tso-chuen-.-vol.-5-hong-` | 3.75 MB | read | 2 |
| 36 | `e-cap` | Coptic Apocrypha in the Dialect of Upper Egypt. E. A. Wallis Budge, British Museum, 1913 | archive: `copticapocryphai00budguoft` | 1.01 MB | read | 2 |
| 37 | `x-lmh` | The Life of Mahomet (abridged), from Original Sources. Sir William Muir, 1887 edition | archive: `lifemahometfrom00muirgoog` | 1.98 MB | read | 2 |
| 38 | `x-udv` | Udanavarga: a Collection of Verses from the Buddhist Canon. W. W. Rockhill, 1883 | archive: `udnavargacolle00bkah` | 0.45 MB | read | 2 |
| 39 | `x-rlb` | The Life of the Buddha and the Early History of his Order. W. W. Rockhill, 1884 | archive: `thelifeofbuddha00rockuoft` | 0.76 MB | read | 2 |
| 40 | `x-ksg` | The Katha Sarit Sagara (Ocean of the Streams of Story), vols 1-2. C. H. Tawney, Calcutta 1880-1884 | archive: `kathsaritsga01somauoft`, `kathsaritsga02somauoft` | 4.32 MB | read | 3 |

Tier 1 are the canons and catalogue promises; tier 2 the strong second works; tier 3 the easy additions. None of the 40 duplicates a Library text (checked by title against all 1,528 entries; two I first listed, Tammuz and Ishtar and Jaina Sutras part II, are already in, and I removed them).

### Round 25: typed texts, government works and the rest of the verified scans

35 texts, 20.8 MB (mostly estimated). **Five need a fetcher the builders do not have** (Kojiki, Kumulipo and Baloma at Sacred Texts, which first needs D2 settled; the Kano Chronicle and the Azusa Street newspaper as PDF); **five are United States government works** after 1930 (Densmore's Yuman and Yaqui and Menominee music, Swanton's Choctaw, Stirling's Acoma, and Bunzel's Zuni once a scan is found); 18 are named from my reading of the Atlas lists and need one Archive search each (the Samaritans, Isaac of Nineveh, the Nestorian monument, Igor, the Dindshenchas, Stcherbatsky, Abbott's saints, Raffles, Emerson, Thoreau, Gregory of Nazianzus). It also holds the Benedict translation and the three tier-3 texts moved from round 24.

| id | Work | Source | Size | Check |
|---|---|---|---|---|
| `a-bun` | Introduction to Zuni Ceremonialism; Zuni Katcinas; Zuni Origin Myths (Bunzel, 47th Annual Report | none | 2.50 MB | S |
| `x-koj` | Ko-ji-ki, or Records of Ancient Matters | sacred-texts | 0.90 MB | S |
| `x-kum` | The Kumulipo (Queen Liliuokalani, 1897) | sacred-texts | 0.15 MB | S |
| `x-apf` | The Apostolic Faith (Azusa Street, Los Angeles), 13 issues, 1906-1908 | pdf | 0.40 MB | S |
| `a-yum` | Yuman and Yaqui Music (Densmore, Bureau of American Ethnology Bulletin 110) | archive `yumanyaquimusic00dens` | 1.00 MB | S |
| `a-men` | Menominee Music (Densmore, BAE Bulletin 102) | archive `menomineemusic00dens` | 1.00 MB | S |
| `a-sou` | Source Material for the Social and Ceremonial Life of the Choctaw Indians (Swanton, BAE Bulletin | archive `sourcematerialfo00swan` | 1.00 MB | S |
| `a-ori` | Origin Myth of Acoma and Other Records (Stirling, BAE Bulletin 135) | archive `originmythofacom00stir` | 1.00 MB | S |
| `p-cpp` | A Fiery Flying Roll (Abiezer Coppe, 1649; facsimile) | archive `fieryflyingroll00coppuoft` | 0.11 MB | R |
| `a-bal` | Baloma: The Spirits of the Dead in the Trobriand Islands | sacred-texts | 0.25 MB | S |
| `a-kno` | The Kano Chronicle (H. R. Palmer, 1908) | zenodo | 0.20 MB | S |
|  | The Samaritan Liturgy (A. E. Cowley, 2 vols) | to find | 0.50 MB | J |
|  | The Asatir: The Samaritan Book of the Secrets of Moses (M. Gaster) | to find | 0.50 MB | J |
|  | The Samaritans: Their History, Doctrines and Literature (M. Gaster) | to find | 0.50 MB | J |
|  | The Samaritans, the Earliest Jewish Sect (J. A. Montgomery) | to find | 0.50 MB | J |
|  | Mystic Treatises by Isaac of Nineveh (A. J. Wensinck) | to find | 0.50 MB | J |
|  | The Nestorian Monument in China and Documents (P. Y. Saeki) | to find | 0.50 MB | J |
|  | The Tale of the Armament of Igor (L. A. Magnus) | to find | 0.50 MB | J |
|  | The Second Battle of Moytura (Whitley Stokes) | to find | 0.50 MB | J |
|  | The Metrical Dindshenchas, vols 1-4 (Edward Gwynn) | to find | 0.50 MB | J |
|  | The Book of the Icelanders (Islendingabok, H. Hermannsson) | to find | 0.50 MB | J |
|  | The Conception of Buddhist Nirvana (T. Stcherbatsky) | to find | 0.50 MB | J |
|  | The Friendly Epistle (Suhrllekha) of Nagarjuna (H. Wenzel) | to find | 0.50 MB | J |
|  | The Life of Tukaram (Mahipati, tr. J. E. Abbott) | to find | 0.50 MB | J |
|  | Life of Eknath (Mahipati, tr. J. E. Abbott) | to find | 0.50 MB | J |
|  | The History of Java, vol. 1 (T. S. Raffles) | to find | 0.50 MB | J |
|  | Emerson: Nature and the Divinity School Address | to find | 0.50 MB | J |
|  | Walden (H. D. Thoreau) | to find | 0.50 MB | J |
|  | Gregory of Nazianzus: Select Orations (NPNF series 2, vol. 7) | to find | 0.50 MB | J |
| `e-bn2` | The Rule of St. Benedict (second translation, so the Library has one that rests on its date alon | archive `ruleofstbenedict0000unse_h4o5` | 0.30 MB | S |
| `x-mmy` | Manual of a Mystic | archive `manualofmysticbe00wood` | 0.36 MB | R |
| `x-vem` | The Verses of Vemana | archive `in.ernet.dli.2015.367308` | 0.28 MB | R |
| `x-pan` | The Panchatantra | archive `Panchatantra_Arthur_W_Ryder` | 0.57 MB | R |
| `x-her3` | Hermetica, vol. 3: Notes on the Corpus Hermeticum (Walter Scott, Oxford 1926) | archive `hermetica0003walt` | 1.70 MB | R |
| `x-chd` | The Chaldaean Oracles (G. R. S. Mead, 1908) | archive `chaldanoraclesv00theugoog` | 84 KB | R |

**Round 25b: the Journal of Discourses**, 26 volumes (Archive `JoDV01` to `JoDV26`; volume 1 is 1.62 MB), about 41.6 MB. It is the record of the sermons where early Latter-day Saint leaders taught plural marriage and other doctrines, and the Atlas names it for Mormon fundamentalism. It is its own item because it is 26 texts.

### Round 26: the ancient world and reference works (searched by name, not yet looked up)

36 rows, 63.7 MB, all estimates: the Cambridge Ancient History volumes I to VIII (the two Archive items I sized are only 230 and 274 pages, so they are plate volumes: the right identifiers are still to find), Sayce and Jastrow on Babylonian religion, the Hittites, Maspero, Langdon's Sumerian texts, the Book of the Dead in a third translation, Plato, Aeschylus, Sophocles, Pindar and Julian from Gutenberg, the Jain Tattvartha Sutra, Legge's Shoo King, Everard's Hermes, the Dinkard. It also holds Buck's Oscan and Umbrian grammar and Safford's Guam (the two sources for traditions with no example). Rows with `checked` J were not looked up.

| id | Work | Source | Size | Check |
|---|---|---|---|---|
|  | The Sacred Books of the Jainas, vols 1-2: Dravya-sangraha (1917) and Tattvarthadhigama (1920) | to find | 0.90 MB | J |
| `x-osc` | A Grammar of Oscan and Umbrian, with the Iguvine Tables | archive `grammarofoscanum00buckuoft` | 0.93 MB | R |
| `x-cah1` | The Cambridge Ancient History, volume I | to find | 3.50 MB | J |
| `x-cah2` | The Cambridge Ancient History, volume II | to find | 3.50 MB | J |
| `x-cah3` | The Cambridge Ancient History, volume III | to find | 3.50 MB | J |
| `x-cah4` | The Cambridge Ancient History, volume IV | to find | 3.50 MB | J |
| `x-cah5` | The Cambridge Ancient History, volume V | to find | 3.50 MB | J |
| `x-cah6` | The Cambridge Ancient History, volume VI | to find | 3.50 MB | J |
| `x-cah7` | The Cambridge Ancient History, volume VII | to find | 3.50 MB | J |
| `x-cah8` | The Cambridge Ancient History, volume VIII | to find | 3.50 MB | J |
|  | The Religion of the Ancient Babylonians (A. H. Sayce, Hibbert Lectures 1887) | to find | 1.20 MB | J |
|  | The Religion of Babylonia and Assyria (M. Jastrow) | to find | 2.50 MB | J |
|  | The Hittites: The Story of a Forgotten Empire (A. H. Sayce) | to find | 0.50 MB | J |
|  | Sumerian Religious Texts (S. Langdon, Babylonian Expedition, vol. 10) | to find | 0.60 MB | J |
|  | Babylonian Liturgies (S. Langdon) | to find | 0.50 MB | J |
|  | Egyptian Hieratic Texts and the Book of the Dead (Budge, various) | to find | 1.00 MB | J |
|  | The Sacred Books of the Jainas, vol. 4: Panchastikayasara (Chakravarti 1920) | to find | 0.30 MB | J |
|  | The Chinese Classics vol. 3: The Shoo King (J. Legge) | to find | 1.50 MB | J |
|  | The Divine Pymander of Hermes Trismegistus (J. Everard, 1650; 1884 reprint) | to find | 0.30 MB | J |
|  | Hymns of the Atharva-Veda or other Vedic Brahmana volumes not yet in | to find | 2.00 MB | J |
|  | Early Zoroastrian Texts: The Pahlavi Mainyo-i-Khard, Dinkard, Zad-sparam (West, Sanjana) | to find | 3.00 MB | J |
| `a-saf` | The Useful Plants of the Island of Guam (with an introduction on the Chamorro) | archive `usefulplantsofis00saffrich` | 1.61 MB | R |
|  | The Dialogues of Plato (Jowett), 5 vols | Gutenberg PG 76464 and the other volumes | 2.00 MB | S |
|  | The Oresteia and Prometheus Bound (Aeschylus) | Gutenberg PG 8604, 8714 | 0.60 MB | S |
|  | The Theban Plays (Sophocles) | Gutenberg PG 31 | 0.35 MB | S |
|  | The Extant Odes of Pindar (Ernest Myers) | Gutenberg PG 10717 | 0.30 MB | S |
|  | The Works of the Emperor Julian, vols 1-3 (W. C. Wright, Loeb) | Gutenberg PG 48664, 48768 | 1.50 MB | S |
|  | The Religions of Ancient Egypt and Babylonia (A. H. Sayce, Gifford Lectures 1902) | to find | 1.50 MB | J |
|  | The Empire of the Hittites (W. Wright) | to find | 0.50 MB | J |
|  | The Dawn of Civilization: Egypt and Chaldaea (G. Maspero) | to find | 2.50 MB | J |
|  | The Civilization of Babylonia and Assyria (M. Jastrow) | to find | 2.50 MB | J |
|  | The Book of the Dead (Renouf and Naville, 1904) | to find | 0.90 MB | J |
|  | The Literature of the Ancient Egyptians (A. Erman, 1927) | to find | 1.20 MB | J |
|  | The Cuneiform Inscriptions and the Old Testament (Schrader, 2 vols) | to find | 2.00 MB | J |
|  | Abbott and Godbole: Stories of Indian Saints (Mahipati), 2 vols | to find | 1.50 MB | J |
|  | The Chinese Classics vol. 2 and 1: Confucian Analects, Mencius, Great Learning (Legge) | to find | 1.50 MB | J |

### Round 27: open-licence corpora (waits for decisions D1 and D2)

About 65 texts, about 35 MB (estimate). Sefaria: the whole Mishnah in English (Kulp, CC-BY, six orders), the Mishna with Bartenura (Silverstein, CC-BY), the William Davidson Talmud in English (CC-BY-NC, 37 tractates, about 20 MB), and Cohen's Berakot (1921). ETCSL: the Sumerian corpus (CC BY-NC-SA, about 400 compositions in about 14 texts). ORACC SAAo (CC BY-SA): the Neo-Assyrian reports. The `resource` rows give each source's licence as I read it. Each text would carry its licence line and attribution in `texts/LICENSES.txt`.

### Round 28: better editions (the first quality batch)

The first 40 of the 57 pending `replace` rows, no net growth: the worst scans first (ranked in the CSV). The Hermetic Museum pilot, the first of Q1, is done. It follows the freeze only if the maker prefers.

### Round 29 and the dated and renewal items

The 1 January 2027 round (about 8 texts, about 15 MB) and whatever the renewal check frees (at best 15 books). Both come after round 27 and before the freeze.

## 5. Disk

Measured on 18 November 2026: the disk container is 994.6 GB (926 GiB); **free 40.1 GB (37.3 GiB)**, matching your 38 of 926.

| Folder | Size | Note |
|---|---|---|
| `texts/` | 1.7 GB | 1,590 MB of text and page-number files and 225 MB of pictures. (The brief says 3.8 GB: that is `downloads/`.) |
| `downloads/` | 3.8 GB | `md` 1.5, `txt` 1.5, `epub` 0.83: about 2.4 times the text; rebuilt by `make_downloads.js` |
| `release/` | 4.9 GB | zips of stamp a0a6d3, stale (the page is now b37afb); the brief says about 7 GB, it measures 4.9 now; about 3.1 times the text if rebuilt |
| `lamplighter/tools/cache/` | 3.9 GB | the builders' source files; deleting it makes every rebuild fetch again |
| `similar/`, `bibles/`, `dictionary/`, `atlas/` | 59, 65, 20, 3.4 MB | small |
| `originals/` | 16 KB | a plan only; **the full plan is 102 GiB and would not fit**; the 1.74 GiB plain-text part would |

What each round adds if everything is regenerated (text bytes times 1 for `texts/`, 2.4 for `downloads/`, 3.1 for `release/`, 1 for the cache):

| Round | Text | `texts/` | `downloads/` | `release/` | cache | Total |
|---|---|---|---|---|---|---|
| 24 | 44.9 MB | 45 MB | 108 MB | 139 MB | 45 MB | **0.34 GB** |
| 25 | 20.8 MB | | | | | 0.16 GB |
| 25b | 41.6 MB | | | | | 0.31 GB |
| 26 | 63.7 MB | | | | | 0.48 GB |
| 27 and 29 | about 50 MB | | | | | about 0.4 GB |
| **All** | about 220 MB | | | | | **about 1.7 GB** (about 1.0 GB if the zips are not rebuilt each time) |

So the rounds are small against 37 GiB. The real risks are elsewhere: a full `fetch_originals.py --go` (102 GiB), rebuilding `release/` without deleting the stale zips first (4.9 GB each time), and any bulk export of a corpus (Sefaria's, ORACC's): take only the texts named here, through their APIs, about 25 MB in all.

**What could be cleaned or moved to keep a safe margin** (a recommendation: I deleted nothing). Keep at least 15 GiB free. In the order I would do it: (1) delete the stale zips in `release/` before the next `make_release.py` (4.9 GB, regenerable); (2) `downloads/` (3.8 GB) is regenerated at the end anyway, so it can leave the disk until then; (3) `tools/cache/` (3.9 GB) can move to another disk and come back for a rebuild. Outside the project, and the maker's own files: the **Trash holds 53 GB** (almost all video files; the project's own cleanup of 17 November is 94 MB of it) and `~/Library/Caches` is 67 GB. Emptying the Trash would free more than this whole plan needs; it is the maker's call.

## 6. Decisions the maker needs to make

| # | Decision | Recommendation |
|---|---|---|
| D1 | Accept CC BY, CC BY-SA and CC BY-NC texts (Sefaria's Mishnah and Talmud, ETCSL, ORACC), each with its licence line; refuse no-derivatives terms (84000, SBL, the Bahai files)? | Yes for BY, BY-SA and BY-NC (free and non-commercial; the text file, not the app, is share-alike); no for ND |
| D2 | Sacred Texts refuses automated reading (403): ask it for its bulk licence or fetch a few pages by hand? And a new fetcher for Sefaria, ETCSL and ORACC? | Do not write a Sacred Texts fetcher on the hope that it works; ask for the licence; one small fetcher for the other three |
| D3 | One download of the 2.2 MB HathiTrust renewal file, kept outside the project and deleted after | Yes |
| D4 | Pre-1931 originals in other languages (28 traditions are coded LANG)? | Not before the quality pass |
| D5 | Bibles in other languages from eBible.org? | Defer |
| D6 | The pre-1931 Bahai translations that are public domain by date? | Keep out unless the maker reverses the earlier choice |
| D7 | A small round in the first week of January 2027 for the 1931 books | Yes |
| D8 | Free space: empty the Trash or move `release/` and `downloads/` | Not needed for these rounds |
| D9 | Freeze the collection after round 27, the January round and the renewal check, then start Q0 | Yes |

## 7. How this was made, and what is unverified

* **Computed from the project's files (D):** every number in section 1 and the tradition counts; the catalogue dispositions come from `TEXT_AUDIT.md`, the Library block and the texts folder.
* **Read at the source (R):** the Archive's own record for each Round 24 item (title, date, whether it is lending-only, the size of the OCR text file); Sefaria's version lists for two tractates and the Zohar; the NYPL and Sefaria-Export repository listings; the HathiTrust file's size; ETCSL's credits page; ORACC's licensing statement; the Library's own texts for the six mapping tests.
* **Search results only (S) and my own judgement (J):** the Sacred Texts items and terms; ETCSL's CC BY-NC-SA licence (read in a search summary of the Oxford Text Archive record); 84000's licence; the typed alternatives for the poor scans except Callaway; every `J` row; **the reason codes of the 263 traditions are my classing and should be read once by someone who knows the traditions**. The Gutenberg estimates could not be checked.
* **Known gaps:** the Archive's search missed some works (Chamberlain's Kojiki, the Kano Chronicle, Winstanley), so "not found" there means "not found by title", not "does not exist". The lending test I used is the record's own `access-restricted-item` field; a few `0000`-style identifiers (the Ikkarim, the She King, the Patriarchs) are of the kind the Archive uses for lending copies though the record shows no restriction: test each with one request before it is built.
* **Do not cite as settled:** that the 1931 books are free on 1 January 2027 (the usual reading of 95 years from publication; the Library's own rule uses it), or the status of Sefaria's "Public Domain" label for the Soncino Zohar.

A short hand-over note is in the shared notes folder: `collection-plan-handover.md`.


## 8. Round 24 built (19 November 2026)

The maker approved round 24 on 19 November 2026 (“alright approved”); a child session built it. **35 of the 40 texts are in `texts/` (34.9 MB of text; the Library went from 1,413 to 1,448 texts), one is held and four are not built**, each for the reason in the table. Every source was read from its Archive record or the Gutenberg mirror first: no record showed a lending-only copy. The specs are `lamplighter/tools/texts_round24.py` (registered at the end of `texts_archive.py`); the Library lines are at the end of the Library block of `src/js/24-data-path-lib.js` and each text is on a Path station (`tests/path.test.js` needs that); the Atlas links are in `tools/atlas_text_aliases.json` and `tools/library_about.json` (the Atlas needs a rebuild).

**What was fetched (one request at a time, six seconds apart, only the OCR text of each Archive item):** Archive records: 37 requests, 2.18 MB; Archive OCR text: 37 requests, 39.19 MB; Gutenberg text (mirror): 6 requests, 3.75 MB; HathiTrust renewal file: 1 requests, 2.23 MB; one HTTP 500 (Archive, one text file, fetched once more after four minutes); one HEAD request to HathiTrust for the file size. **Page data (the maker’s “Yes, fetch”, 19 November):** 93 files, 64.2 MB, for the 34 Archive items behind the 30 scan texts (25 items with the three small files `_page_numbers.json`, `_hocr_pageindex.json.gz` and `_hocr_searchtext.txt.gz`, 9 with `_djvu.xml` and `_scandata.xml`), one request at a time, six seconds apart, with one HTTP 500 (the Coptic Apocrypha’s search-text file: the run was paused, and the file came on the second attempt, last). `texts_pages.py build --only=` the 30 ids gave **printed-page marks to 29 of them** (27 of grade a, 2 of grade b: `e-pat` and `e-cap`); the Library now has 470,954 marks on 1,107 texts. **`x-cts` has none:** the page numbers the Archive read for the 1960 reissue could not be checked against the pages, and the tool leaves a text without marks rather than show wrong ones. The five typed Gutenberg texts (`x-hvm`, `x-dre`, `x-asr`, `x-avr`, `a-mor`) have none either: their numbers come from Gutenberg’s web editions, which the yes did not cover.

**The maker’s note of 19 November, “keep any non religious history separate”,** was applied in this round to `a-sul` (held) and to the second volume of Rammohun Roy (administration and politics, left out). It still needs a place: a shelf of its own, shelf-only and left out of Random and Find similar like the imagined shelf, for what rounds 25 and 26 hold (the Cambridge Ancient History, Raffles, Maspero, Jastrow and the like). The Culavamsa, the History of the Patriarchs of Alexandria and Muir’s Life of Mahomet are religious chronicles and biographies and stay with their traditions.

| # | id | text | source | source bytes | sections | characters | result and notes |
|---|---|---|---|---|---|---|---|
| 1 | `e-mis` | Eighteen Treatises from the Mishna (D. A. de Sola and M. J.  | `eighteentreatis00raphgoog` | 926,492 | 76 | 887,146 | built. Harvard Divinity School copy; the translators’ list of all 63 tractates stays as short sections |
| 2 | `x-msb` | Mishcat-ul-Masabih: a collection of the traditions (hadith)  | `10219219bsb`, `10219220bsb` | 2,988,483 | 111 | 2,760,835 | built. Munich scan, rough OCR (about 14 odd symbols per 1,000 characters); by Book; list of subscribers and the index of names cut |
| 3 | `x-hid` | The Hedaya, or Guide: a Commentary on the Mussulman Laws (Ch | `hedayaorguide029357mbp` | 5,100,036 | 173 | 4,040,873 | built. the scan is the 1957 Lahore reproduction (reprint 1963) of Grady’s one-volume second edition of 1870, not Hamilton’s 1791 four volumes; the 1957 publisher’s note and the index cut; Book XI heading restored from its running head |
| 4 | `x-hvm` | Harivamsha (Manmatha Nath Dutt, 1897) | `PG61937` | 1,859,515 | 237 | 1,753,699 | built. typed; Bhavishya Parva chapters named after it |
| 5 | `x-mnu` | Thirty Minor Upanishads (K. Narayanasvami Aiyar, 1914), incl | `thirtyminorupani00xxxxuoft` | 613,663 | 36 | 579,221 | built. by Upanishad (30 headings found) |
| 6 | `e-syn` | Senkessar (the Book of the Saints of the Ethiopian Church; B | `bookofsaintsofet0001unse`, `bookofsaintsofet0002unse` | 1,623,863 | 130 | 1,555,316 | built. volumes 1–2 of 4; by day; Ethiopic-type noise lines partly removed |
| 7 | `x-ibn` | Ibn Arabi, Fusus al-Hikam (a synopsis: Wisdom of the Prophet | `wisdomofprophets0000ibna` | 450,375 | 31 | 429,729 | built. a 1928 synopsis with analytical notes (Khaja Khan), not the Fusus itself; by chapter (27) |
| 8 | `x-dre` | Dresden Codex (Förstemann’s Commentary on the Maya Manuscrip | `PG43519` | 448,679 | 80 | 430,974 | built. a commentary, not the codex; by codex page (80 sections) |
| 9 | `x-asr` | The Secrets of the Self (Asrar-i Khudi; Muhammad Iqbal, tran | `PG57317` | 153,414 | 20 | 119,423 | built. typed; 18 sections and the prologue |
| 10 | `x-avr` | The Philosophy and Theology of Averroes (trans. Mohammad Jam | `PG65708` | 299,308 | 13 | 285,812 | built. typed; Gutenberg’s footnotes kept as [N] |
| 11 | `a-mor` | Studies in Moro History, Law, and Religion (Najeeb M. Saleeb | `PG41770` | 255,944 | 12 | 241,257 | built. typed; US government (Philippine Ethnological Survey) 1905 |
| 12 | `a-sul` |  | `PG41771` | 736,220 | - | - | HELD: non-religious history. same series, 1908: mostly the political history of a sultanate; held while “keep any non religious history separate” is applied; catalogue line removed, nothing built |
| 13 | `x-spk` |  | `thespandakarikas00vasuuoft` | 89,942 | - | - | NOT BUILT: Sanskrit only. the Kashmir Series’ Sanskrit edition (vol. VI, 1913), edited by J. C. Chatterji (not translator); Devanagari only, OCR is noise |
| 14 | `x-ssm` | Shiva Samhita (trans. Srisa Chandra Vasu, Sacred Books of th | `YogaShivaSamhita_201903` | 133,545 | 5 | 117,690 | built. the scan has no year; Vasu in the Panini Office series |
| 15 | `x-gsm` | Gheranda Samhita (trans. Srisa Chandra Vasu, 1914–15) | `Gheranda_Samhita` | 97,416 | 8 | 82,735 | built. scan of the 1979 Delhi reprint of Vasu (1914–15); imprint pages cut |
| 16 | `x-kul` |  | `ArthurAvalonKularnavaTantraEng` | 200,923 | - | - | NOT BUILT: in copyright (Pandit 1965). the Archive title says Arthur Avalon, the file is M. P. Pandit’s English with the Motilal Banarsidass imprint and ISBN: in copyright; the cached text was moved out of the project |
| 17 | `x-htg` | Hymns to the Goddess (Arthur and Ellen Avalon, 1913) | `in.ernet.dli.2015.281515` | 283,220 | 25 | 264,601 | built. Luzac 1913; by the goddess named in the running head |
| 18 | `x-pot` | Principles of Tantra (Tantratattva; Arthur Avalon, 1914–16) | `dli.bengal.10689.636` | 2,470,752 | 85 | 2,055,935 | built. third edition (Ganesh and Co., 1960); the publishers’ notes (4) cut; Part I and Part II chapters I–XX |
| 19 | `x-skt` | Shakti and Shakta (John Woodroffe, 1918) | `in.ernet.dli.2015.213495` | 546,609 | 18 | 474,001 | built. Luzac 1918; seven essays |
| 20 | `x-pcr` | Introduction to the Pancaratra and the Ahirbudhnya Samhita ( | `introtothepancar00shcruoft` | 409,942 | 15 | 279,368 | built. Adyar Library 1916; contents list and indexes cut |
| 21 | `x-cv1` | Culavamsa, part 1: the more recent part of the Mahavamsa (Wi | `in.ernet.dli.2015.277108` | 889,881 | 39 | 846,497 | built. Pali Text Society no. 18, 1929; Geiger’s German put into English by Mrs. Rickmers |
| 22 | `x-cv2` | Culavamsa, part 2: the more recent part of the Mahavamsa (Wi | `in.ernet.dli.2015.277099` | 870,720 | 35 | 816,514 | built. no. 20, 1930 |
| 23 | `x-pp2` | The Path of Purity: Visuddhimagga, part 2 (Pe Maung Tin, 192 | `in.gov.ignca.9221` | 911,051 | 36 | 875,160 | built. PTS no. 17; the title page has no year, the Archive says 1931 (that is part III); series order puts it not later than 1929 |
| 24 | `e-ikk` | Sefer ha-Ikkarim (Joseph Albo, trans. Husik, Book Two, 1929) | `seferhaikkarimbo0000jose` | 479,728 | 32 | 445,256 | built. Book Two only (volume 2 of 4); Hebrew noise |
| 25 | `x-bos` | The Bustan of Sa’di (H. Wilberforce Clarke, 1879) | `bstnbyshaikh00sadiuoft` | 779,416 | 26 | 601,645 | built. Clarke 1879; contents and erratum cut |
| 26 | `x-sat` | Satyarth Prakash (Dayananda Sarasvati, trans. Durga Prasad,  | `satyarthprakashl00dayauoft` | 2,090,363 | 70 | 1,762,479 | built. the translator is Durga Prasad (1908), not Chiranjiva Bharadwaja; Devanagari left out |
| 27 | `x-rmr` | The English Works of Raja Rammohun Roy: Vedanta, Upanishads, | `theenglishworks01rammuoft`, `theenglishworks02rammuoft` | 1,258,625 | 21 | 549,201 | built. volume 1 whole; from volume 2 only the sati debates (the rest is administration and politics, left out) |
| 28 | `e-tgn` |  | `cu31924074296975` | 1,297,409 | - | - | NOT BUILT: same scan as e-tgo. the plan’s Archive item is the volume with Leviticus, Numbers and Deuteronomy (1865), already e-tgo; Genesis and Exodus (1862) needs its own item |
| 29 | `p-psp` | Pseudo-Philo, Biblical Antiquities (M. R. James, 1917) | `cu31924063410827` | 495,409 | 19 | 464,490 | built. James’s introduction, the translation with notes, two appendices; index cut |
| 30 | `e-pat` | History of the Patriarchs of the Coptic Church of Alexandria | `historyofpatriar0000beve` | 1,254,699 | 30 | 727,609 | built. part III only (Agathon to Michael I, 661–766), Patrologia Orientalis 5.1 (1910), not the 1904 volume; Arabic noise lines removed |
| 31 | `x-ant` | The Antagada-dasao and Anuttarovavaiya-dasao (L. D. Barnett, | `antagadadasaoanu00royauoft` | 390,812 | 19 | 310,775 | built. Barnett, Royal Asiatic Society 1907 |
| 32 | `x-uva` |  | `in.ernet.dli.2015.282413` | 162,572 | - | - | NOT BUILT: Prakrit edition, no translation, 1930/31+. Vaidya’s student edition of the Prakrit text with an English introduction and notes, prepared for the 1931–32 course: not a translation, and not before 1930; Hoernle’s 1885 edition needs its own item |
| 33 | `a-loy` | Among the Natives of the Loyalty Group (Emma Hadfield, 1920) | `amongnativesoflo00hadfuoft` | 566,578 | 22 | 458,799 | built. Macmillan 1920 |
| 34 | `x-she` | The She King, or Book of Ancient Poetry, in English verse (J | `shekingorbookofa0000unse` | 843,768 | 39 | 802,099 | built. Legge’s verse translation of 1876, not the prose of the Chinese Classics vol. IV |
| 35 | `x-cts` | The Ch’un Ts’ew with the Tso Chuen (James Legge, 1872) | `james-legge-the-chinese-classics-the-chun-tsew-with-the-tso-chuen-.-vol.-5-hong-` | 3,752,465 | 143 | 3,472,808 | built. the 1960 Hong Kong University Press reissue; its bibliographical note and concordance table (new in 1960) cut; Chinese text absent |
| 36 | `e-cap` | Coptic Apocrypha in the Dialect of Upper Egypt (E. A. Wallis | `copticapocryphai00budguoft` | 1,011,137 | 37 | 604,264 | built. Budge 1913; 58 plates not reproduced |
| 37 | `x-lmh` | The Life of Mahomet from Original Sources (Sir William Muir, | `lifemahometfrom00muirgoog` | 1,977,545 | 66 | 1,562,715 | built. Muir’s own abridgment of 1861 (this printing 1887) |
| 38 | `x-udv` | Udanavarga (W. W. Rockhill, 1883) | `udnavargacolle00bkah` | 445,518 | 13 | 306,389 | built. Trübner 1883; chunked, no chapter headings found |
| 39 | `x-rlb` | The Life of the Buddha and the Early History of his Order (W | `thelifeofbuddha00rockuoft` | 760,822 | 23 | 586,665 | built. Trübner 1884; chunked |
| 40 | `t-ksg` | The Katha Sarit Sagara, or Ocean of the Streams of Story, vo | `kathsaritsga01somauoft`, `kathsaritsga02somauoft` | 4,318,489 | 139 | 3,382,086 | built. id changed from the plan’s x-ksg: a folk-tale-shelf book takes a t- id (tests/path.test.js); by book and chapter; the 1880 and 1884 volumes |

**Changes to the plan’s rows:** x-hid is Grady’s 1870 abridgment; x-ibn is a synopsis; x-dre a commentary; x-spk Sanskrit only; x-kul in copyright; e-tgn the same scan as e-tgo; x-uva not a translation; x-pp2 and x-sat and e-pat and x-she name other editions than the plan gave (see the table); x-ksg became `t-ksg`.

**Rights notes for the reissues and reprints:** the Hedaya (Lahore 1957, reprint 1963), the Gheranda Samhita (Delhi 1979), Principles of Tantra (Ganesh, third edition 1960) and the Ch’un Ts’ew (Hong Kong University Press 1960) are reprints of pre-1931 translations. Only the author’s text is kept; the publishers’ notes, concordance tables and imprint pages (new matter) are cut, and each entry’s note says which edition the scan is. The Library’s licence line on a scan says “read by machine”; on a typed text it does not.

**For the project manager’s integration:** run `python3 -I tools/build_atlas.py` (aliases, `_partial` flags and seven `library_about` entries are new), `node tools/make_downloads.js`, and rebuild Find similar once (groups touched: `ju` e-mis e-ikk; `is` x-msb x-hid x-ibn x-asr x-avr x-bos; `in` x-hvm x-mnu x-ssm x-gsm x-htg x-pot x-rmr x-sat; `bu` x-cv1 x-cv2 x-pp2 x-udv x-rlb; `ja` x-ant; `ch` x-she x-cts; `ps` p-psp; `ec` e-pat e-cap; `am` x-dre; `af` e-syn; the shelf-only books are not indexed). `tests/originals.test.js` notes that the new texts have no `texts_originals.py` entry; the printed-page marks need the maker’s yes for the page data.


## 9. The renewal check (19 November 2026): not completed, and why

The maker approved one download of the HathiTrust renewal file (decision D3). It was fetched once (`https://www.hathitrust.org/files/CRMSRenewals.tsv`, 2,226,531 bytes, kept in the session’s scratch folder and deleted after this check). **It cannot answer the question by itself:** it has 67,808 lines of three columns, a HathiTrust volume id (`htid`, such as `chi.086286692`), a renewal number (`R527631`, `RE384920`) and a renewal date (`25Apr72`), and no title, author or year. The ids belong to 20 or so libraries (`uc1` 25,290, `mdp` 18,466, `uva` 4,997, `wu` 3,332, `uiug` 3,288 and so on). The plan’s reading that “a script checks every title in minutes” was written from the file’s size alone.

To check a title one first needs its HathiTrust volume id (from HathiTrust’s catalogue or its Bib API, by OCLC, LCCN or title), and then a hit in the file means “renewed”; no hit means only “not renewed or not reviewed”, which is not yet a clearance. That lookup is a new fetch (about 18 small catalogue requests for the candidates below, a few kilobytes each, six seconds apart, about four minutes), so I have not made it; **every row is recorded as “not checked”**:

| title | author | first published | US publisher | result |
|---|---|---|---|---|
| The Sabbath (Abraham Joshua Heschel) | Abraham Joshua Heschel | 1951 | Farrar, Straus and Young, New York | not checked: no HathiTrust volume id yet |
| God in Search of Man (Heschel) | Abraham Joshua Heschel | 1955 | Farrar, Straus and Cudahy, New York | not checked: no HathiTrust volume id yet |
| Judaism as a Civilization (Mordecai Kaplan) | Mordecai M. Kaplan | 1934 | Macmillan, New York | not checked: no HathiTrust volume id yet |
| Tell My Horse (Zora Neale Hurston) | Zora Neale Hurston | 1938 | J. B. Lippincott, Philadelphia | not checked: no HathiTrust volume id yet |
| Divine Horsemen (Maya Deren) | Maya Deren | 1953 | Thames & Hudson, London and New York | not checked: no HathiTrust volume id yet |
| Mules and Men (Zora Neale Hurston) | Zora Neale Hurston | 1935 | J. B. Lippincott, Philadelphia | not checked: no HathiTrust volume id yet |
| Voodoo in New Orleans (Robert Tallant) | Robert Tallant | 1946 | Macmillan, New York | not checked: no HathiTrust volume id yet |
| Hopi Journal of Alexander M. Stephen | Elsie Clews Parsons (ed.) | 1936 | Columbia University Press | not checked: no HathiTrust volume id yet |
| The Sacred Pipe (Black Elk and Joseph Epes Brown) | Black Elk and Joseph Epes Brown | 1953 | University of Oklahoma Press, Norman | not checked: no HathiTrust volume id yet |
| The Navaho | Clyde Kluckhohn and Dorothea Leighton | 1946 | Harvard University Press | not checked: no HathiTrust volume id yet |
| Navaho Religion: A Study of Symbolism | Gladys A. Reichard | 1950 | Pantheon Books (Bollingen Series), New York | not checked: no HathiTrust volume id yet |
| Introduction to Zuñi Ceremonialism; Zuñi Katcinas; Zuñi Origin Myths; Zuñi Ritual Poetry | Ruth L. Bunzel | 1932 | Forty-seventh Annual Report of the Bureau of American E | not checked: no HathiTrust volume id yet |
| In Search of the Miraculous (P. D. Ouspensky) | P. D. Ouspensky | 1949 | Harcourt, Brace & World, New York | not checked: no HathiTrust volume id yet |
| Beelzebub's Tales to His Grandson (G. I. Gurdjieff) | G. I. Gurdjieff | 1950 | Harcourt, Brace, New York (English, 1950) | not checked: no HathiTrust volume id yet |
| Unveiled Mysteries (Godfré Ray King) | Godfré Ray King (Guy W. Ballard) | 1934 | Saint Germain Press, Chicago | not checked: no HathiTrust volume id yet |
| God Speaks (Meher Baba) | Meher Baba | 1955 | Dodd, Mead & Co., New York | not checked: no HathiTrust volume id yet |
| The Voice of Venus (Ernest Norman) | Ernest L. Norman | 1954 | Unarius, El Cajon | not checked: no HathiTrust volume id yet |
| Humanist Manifesto | Raymond B. Bragg and 33 co-signers | 1933 | The New Humanist (Chicago) | not checked: no HathiTrust volume id yet |

Bunzel’s Zuni volume is a Bureau of American Ethnology report (a United States government work) and needs no renewal check; it needs a scan (round 25). The 1931 to 1963 books of the plan’s other lists (the eleven further titles in section 2.6 and the dated rows) are also “not checked”. **Asked of the maker:** may the session look up the volume ids of these titles in HathiTrust’s catalogue (about 18 to 40 small requests, six seconds apart), or should the Stanford Copyright Renewal Database (about 60 small pages) or the NYPL `cce-renewals` files (96 MB) be used instead?


## 10. The mapping pass (19 November 2026): the part that could be checked

A bounded check of the plan’s “already covered by a book the Library holds” claim, by searching the Library’s texts. **Two of the plan’s eight are true and are now linked** (Atlas aliases, marked as held in part): the Great Hymn to the Aten (`great-hymn-to-the-aten`) and the Memphite Theology (`memphite-theology-shabaka-stone`) are quoted and discussed in Breasted’s lectures, `x-bdr` (the hymn is given at length under “Universal splendor and power of Aton”; the theology as the “heart and tongue” of Ptah). **The others are not what the plan said, and are left unlinked:** the Merneptah stele has no Atlas record, and `x-are` names Merneptah 113 times but the poem’s “Israel is laid waste” is not in it (one mention of Israel, in a note); the Huarochirí Manuscript is not in Markham’s `x-nrl`, which prints Avila’s Spanish “Narrative of the errors, false gods and other superstitions and diabolical rites in which the Indians of the province of Huarochiri lived” (1608), a related and different work; `x-mch` (Brinton’s Maya Chronicles) prints the Series of the Katuns and other pieces from the Books of Chilan Balam, not the Chumayel or the Tizimin as the Atlas names them; in `x-ifu` (Barton’s Ifugao Law) “hudhud” is a payment in a divorce, not the epic; `a-phil` (Blair and Robertson) names Panay and the Sulod but does not hold the Hinilawod. The six traditions the plan names were not re-checked.

## 11. Round 25c: Universalist and Unitarian texts (23 November 2026)

Added on the maker's words on Monday 23 November 2026: "add more universalist texts to the list" (after learning that the Library holds one Universalist book, Ballou's Treatise on Atonement, `x-blu`). **List only: nothing was fetched, built or changed in the Library.** Files touched: `COLLECTION_NEXT.csv` (615 to 652 records: 31 `text` rows with round `25c`, 1 `resource`, 1 `date-gated`, 4 `renewal`), `lamplighter/tools/post1930_wanted.py` and the two files it writes (`POST1930_WANTED.csv`, 266 to 278 rows, and `POST1930_WANTED.md`).

**The batch.** 31 public-domain texts, **32.1 MB** estimated (images x 2,400 bytes; no text file was sized): value 1 six rows, value 2 seventeen, value 3 eight. Three groups, named in each row's `fills` so one can be dropped without touching the others: **the Universalist side** (22 rows: Winchester, Murray, Chauncy, Ballou, Eddy's history, the Winchester Profession and the rest), **the doctrine from outside the Universalist churches** (5 rows: Farrar, Jukes, Cox, Allin, Beecher) and **the Unitarian side** (4 rows: Priestley, Parker, Channing's Works, Cooke's history). Shelf `mo` (kind `mod`) for the primary texts and `sc` (kind `sec`) for the histories, as `x-blu`, `x-chu` and `x-fro` already are.

| rank | id | Work | Source | Size | Check |
|---|---|---|---|---|---|
| 1 | `x-wur` | The Universal Restoration, Exhibited in Four Dialogues between a Minister... | `univstora00winc` | 0.69 MB | R |
| 2 | `x-mls` | Letters and Sketches of Sermons (John Murray), three volumes | `letterssketcheso01murr` +2 | 3.12 MB | R |
| 3 | `x-cmh` | The Mystery Hid from Ages and Generations, Made Manifest by the... | `mysteryhidfromag00chau` | 1.06 MB | R |
| 4 | `x-bfr` | An Examination of the Doctrine of Future Retribution, on the Principles of... | `examinationofdoc00ball_0` | 0.52 MB | R |
| 5 | `x-edd` | Universalism in America: A History (Richard Eddy), two volumes | `universalisminam01eddy` +1 | 2.96 MB | R |
| 6 | `x-wpb` | The Winchester Profession (1803): the Universalist Profession of Belief... | ccel.org (Schaff, section 117) | 0.01 MB | R |
| 7 | `x-mrl` | Records of the Life of the Rev. John Murray, Written by Himself (with a... | `recordsoflifeofr00murrrich` | 0.65 MB | R |
| 8 | `x-bnp` | Notes on the Parables of the New Testament (Hosea Ballou) | `notesonparables01ballgoog` | 0.75 MB | R |
| 9 | `x-ahu` | Ancient History of Universalism, from the Time of the Apostles to Its... | `ancienthistoryu01ballgoog` | 0.83 MB | R |
| 10 | `x-wmh` | The Modern History of Universalism, from the Era of the Reformation to the... | `modernhistoryofu01whit` | 1.00 MB | R |
| 11 | `x-aeh` | A History of the Unitarians and the Universalists in the United States... | `historyofunitari0010alle` | 1.29 MB | R |
| 12 | `x-ski` | The Social Implications of Universalism (Clarence R. Skinner) | `socialimplicati00skingoog` | 0.26 MB | R |
| 13 | `x-bsh` | An Inquiry into the Scriptural Import of the Words Sheol, Hades, Tartarus,... | `aninquiryintosc01balfgoog` | 1.11 MB | R |
| 14 | `x-hci` | Calvinism Improved; or, The Gospel Illustrated as a System of Real Grace,... | `calvinismimprove00hunt` | 0.84 MB | R |
| 15 | `x-gdb` | Some Remarkable Passages in the Life of Dr. George de Benneville | `someremarkablepa00debe` | 0.17 MB | R |
| 16 | `x-sie` | The Everlasting Gospel, Commanded to Be Preached to Every Creature (Paul... | `everlastinggospe00sieg` | 0.40 MB | R |
| 17 | `x-wst` | Gerrard Winstanley: The Mysterie of God, Concerning the Whole Creation,... | `ldpd_6420628_000` +1 | 0.38 MB | R |
| 18 | `x-far` | Eternal Hope: Five Sermons Preached in Westminster Abbey, November and... | `eternalhope0000fred` | 0.74 MB | R |
| 19 | `x-jkd` | The Second Death and the Restitution of All Things (Andrew Jukes) | `seconddeathandr03jukegoog` | 0.43 MB | R |
| 20 | `x-prc` | An History of the Corruptions of Christianity (Joseph Priestley) | `bub_gb_E5IPAAAAIAAJ` | 0.88 MB | R |
| 21 | `x-pdt` | A Discourse of the Transient and Permanent in Christianity (Theodore Parker) | `transientpermane1907park` | 0.11 MB | R |
| 22 | `x-chw` | The Works of William E. Channing, D.D. (one-volume edition) | `worksofwilliamec00chaniala` | 2.29 MB | R |
| 23 | `x-cuk` | Unitarianism in America: A History of Its Origin and Development (George... | Gutenberg 8605 | 0.95 MB | S |
| 24 | `x-bsl` | Lecture Sermons (Hosea Ballou) | `aserieslectures03ballgoog` | 1.15 MB | R |
| 25 | `x-wlb` | Life of Rev. Hosea Ballou, with Accounts of His Writings (Thomas... | `lifeofrevhoseaba01whit` +1 | 4.08 MB | R |
| 26 | `x-gle` | The Gleaner: A Miscellaneous Production (Judith Sargent Murray), three volumes | `gleanermiscellan01murr` +2 | 2.43 MB | R |
| 27 | `x-obr` | Acquaintances, Old and New, among Reformers (Olympia Brown) | `acquaintancesol00browgoog` | 0.33 MB | R |
| 28 | `x-jld` | Jane Leade: The Revelation of Revelations (1683) and The Enochian Walks... | `bim_early-english-books-1641-1700_the-revelati` +1 | 0.42 MB | R |
| 29 | `x-cox` | Salvator Mundi; or, Is Christ the Saviour of All Men? (Samuel Cox) | `salvatormundiori00coxsrich` | 0.68 MB | R |
| 30 | `x-all` | Universalism Asserted as the Hope of the Gospel on the Authority of... | `universalismass08alligoog` | 0.69 MB | R |
| 31 | `x-bec` | History of Opinions on the Scriptural Doctrine of Retribution (Edward Beecher) | `historyopinions01beecgoog` | 0.90 MB | R |

**What was read.** On 23 November 2026 the Internet Archive's own search records were read (identifier, title, year, publisher, number of images, lending flag; check R) by a page-reading helper, three runs of 12, 12 and 1 requests, none refused. **No scan was opened**, so an edition detail beyond the record is unconfirmed; first-edition years marked "to confirm" or "from memory" are mine. Check S: the Cooke row (the Gutenberg title came from a search result) and the `tcp` resource row.

**Findings that change other rows.**
* **The Winchester Profession (1803) is not in the Library.** `e-cch` (Schaff, 6.5 MB) has no section headed The Universalists and no Profession of Belief; the typed copy at ccel.org (volume 1, section 117) has it (row `x-wpb`, about 6 KB).
* **Winstanley fills the Diggers gap.** `x-wst` (The Mysterie of God and The Law of Freedom, both open on the Archive) answers the `diggers` tradition row ("Winstanley's tracts not yet found"); his Digger tracts of 1649 were still not found.
* **Typed copies may exist for the old imprints.** The Text Creation Partnership's typed texts (Evans-TCP, ECCO-TCP, EEBO-TCP) are public domain; the Oxford Text Archive lists one for Winchester's Universal Restoration (N19247). OCR of 1600s and 1700s type is poor, so the `tcp` resource row asks whether to add a TEI fetcher. Not looked up for the other old works.
* **Servetus.** The English translation (Wilbur 1932) is lending-only on the Archive and free in the United States on 1 January 2028 (a `date-gated` row for jan2028, plus a `renewal` row). The 1531 Latin original is an open scan (McGill).
* **Already queued, not repeated:** Isaac of Nineveh's Mystic Treatises (round 25 rank 16) and Emerson's Nature and Divinity School Address (round 25 rank 27). Already held: Origen (`e-ori`), Clement (`e-clx`), Gregory of Nyssa (`e-m05`), Channing's Baltimore sermon (`x-chu`), the Racovian Catechism (`x-rcc`).

**Found and left out** (open on the Archive; beyond a request for Universalist texts): Lindsey, An Historical View of the Unitarian Doctrine and Worship (1783, `historicalviewof00lind`); Priestley, An History of Early Opinions Concerning Jesus Christ (1786, `anhistoryearlyo00priegoog` and others); Parker, A Discourse of Matters Pertaining to Religion (1842, `adiscoursematte08parkgoog`); Leade, A Fountain of Gardens (1697-1701). Not found as an open scan: Chauncy's Salvation for All Men (1782; only lending-only reprints), Biddle's Twofold Catechism, Winstanley's 1649 Digger tracts.

**In copyright (the wanted list, not this list).** Twelve books were added to `POST1930_WANTED.csv` through the `EXTRA` list in the generator: Cassara's Universalism in America (1971), Miller's The Larger Hope (1979 and 1985), Wilbur's History of Unitarianism (1945 and 1952), Wright's Beginnings of Unitarianism in America (1955), the Wilbur translation of Servetus (1932), Robinson (1985), Howe (1993), Buehrens and Church (1989), Adams (1976) and Singing the Living Tradition (1993). The four from 1931 to 1963 are marked as renewal candidates. Cassara, Miller and Wilbur 1945 were confirmed by search; the rest, and the years of Wilbur's second volume, are from memory and say so in their notes.

**For whoever builds it.** One spec in the style of `texts_round23.py`; the multi-volume rows join their identifiers in order; hand-cut head and tail as before. Map each new text to its tradition in `library_about.json` at build time (Universalist side to `unitarian_universalism`, Unitarian side to `unitarianism`); the Atlas has no row for the Universalist Church of America (1793-1961), so that is an Atlas addition if wanted. Decisions for the maker: (a) go-ahead to fetch round 25c; (b) keep or drop the doctrine-from-outside and Unitarian groups (nine rows); (c) a TEI fetcher for typed copies (the `tcp` row).

## 12. Round 25c built (23 November 2026)

The maker said “Fetch now” on 23 November 2026 (Monday, about 14:00 their time) to the question of when round 25c should be fetched, and the child session that wrote the list built it. **All 31 texts are in `texts/` (26.5 million characters, 26.9 MB of files; the Library went from 1,448 to 1,479 texts); nothing was held back, nothing was committed.** Fetching was one request at a time, six seconds apart, from the Archive (39 scans, each record and then its OCR text, and two searches for the missing volumes), Project Gutenberg’s mirror (8605) and one typed page at ccel.org: 85 requests, 32.8 MB, no refusal, no source stopped (the one 404 was the Gutenberg mirror’s `8605-0.txt`; `8605.txt` answered). No page data, images or PDFs were fetched. The specs are `lamplighter/tools/texts_round25c.py` (registered at the end of `texts_archive.py`; the Winchester Profession has a builder of its own, registered in `build_texts.py`); the Library lines are at the end of the Library block of `src/js/24-data-path-lib.js`, each `mo` text is read at the Path station of the nineteenth-century movements of the Protestant churches (where Ballou’s Treatise on Atonement and Channing’s Unitarian Christianity already are) and each `sc` text is on that station’s shelf; the Library parts are in `src/js/2z-subshelves-core.js`; the Atlas links (`library_about.json`, 25 texts) wait for `build_atlas.py`.

| # | id | text | source (Archive items unless named) | source bytes | sections | characters | what was done and found |
|---|----|------|-------------------------------------|--------------|----------|------------|-------------------------|
| 1 | `x-wur` | The Universal Restoration (Elhanan Winchester, 1788; 1792 edition) | `univstora00winc` | 536,601 | 17 | 420,534 | Princeton scan; 1792 type, long-s OCR errors (4.6% of words not in the vocabulary after the repair pass); the author’s account and the four dialogues; the contents summary cut |
| 2 | `x-mls` | Letters and Sketches of Sermons (John Murray, 1812), three volumes | `letterssketcheso01murr`, `letterssketcheso02murr`, `letterssketcheso03murr` | 3,452,834 | 114 | 2,891,364 | three volumes in parts of about 25,000 characters (the page headers “LETTER I. 25” defeat heading-by-heading splitting); editorial advertisement and contents kept, errata cut |
| 3 | `x-cmh` | The Mystery Hid from Ages and Generations (Charles Chauncy, 1784) | `mysteryhidfromag00chau` | 780,732 | 26 | 641,927 | Tufts copy; 1784 type (10.3% unknown words, “rougher than most”); preface and the three chapters; bookseller’s list cut |
| 4 | `x-bfr` | An Examination of the Doctrine of Future Retribution (Hosea Ballou, 1834) | `examinationofdoc00ball_0` | 349,819 | 14 | 333,683 | Princeton copy; preface to the conclusion; the printed index at the end is kept (its heading is unreadable), library slips cut |
| 5 | `x-edd` | Universalism in America: A History (Richard Eddy, 1884–86), two volumes | `universalisminam01eddy`, `universalisminam02eddy` | 2,892,200 | 95 | 2,292,793 | two volumes, by chapter; volume I is the second edition (1636–1800 on its title page) |
| 6 | `x-mrl` | Records of the Life of the Rev. John Murray (1816) | `recordsoflifeofr00murrrich` | 797,567 | 27 | 666,418 | the title page says the continuation is “by a friend”; the 1816 copyright entry is Judith Sargent Murray’s; the bookseller’s notice cut |
| 7 | `x-bnp` | Notes on the Parables of the New Testament (Hosea Ballou, 1804; 1852 edition) | `notesonparables01ballgoog` | 530,830 | 20 | 509,385 | the scan is the sixth edition of 1852 (revised by the author); the preface dates the writing to 1804 and the third edition to 1822; by parts |
| 8 | `x-ahu` | Ancient History of Universalism (Hosea Ballou 2nd, 1829) | `ancienthistoryu01ballgoog` | 580,823 | 20 | 530,241 | chapters I–IX, preface kept, contents cut; 6.6% unknown words |
| 9 | `x-wmh` | The Modern History of Universalism (Thomas Whittemore, 1830; 1860 edition, volume I) | `modernhistoryofu01whit` | 1,026,565 | 33 | 828,950 | volume I of the second edition of 1860 only: its preface promises the rest, which this Archive item does not hold; the complete first edition of 1830 is another scan (`modernhistoryun01whitgoog`, not fetched) |
| 10 | `x-aeh` | A History of the Unitarians and the Universalists in the United States (Allen and Eddy, 1894) | `historyofunitari0010alle` | 1,008,504 | 40 | 964,719 | Allen’s The Unitarians, then Eddy’s The Universalists; the library’s catalogue card cut |
| 11 | `x-ski` | The Social Implications of Universalism (Clarence R. Skinner, 1915) | `socialimplicati00skingoog` | 104,864 | 4 | 97,167 | four parts (no chapter headings) |
| 12 | `x-bsh` | An Inquiry into the Scriptural Import of the Words Sheol, Hades, Tartarus and Gehenna (Walter Balfour, 1824) | `aninquiryintosc01balfgoog` | 856,543 | 34 | 816,358 | the scan is the first edition of 1824 (Charlestown: Geo. Davidson), not a Boston printing of 1832 as the list said; contents and introduction kept as the Introduction |
| 13 | `x-hci` | Calvinism Improved (Joseph Huntington, 1796) | `calvinismimprove00hunt` | 584,961 | 19 | 483,881 | the title page names Huntington (a posthumous work); 1796 type, 9.6% unknown words; the author’s address and the introduction kept |
| 14 | `x-gdb` | Some Remarkable Passages in the Life of Dr. George de Benneville (1800; 1890 edition) | `someremarkablepa00debe` | 72,704 | 3 | 60,314 | the long title page kept; the library’s preservation stamp cut |
| 15 | `x-sie` | The Everlasting Gospel (Paul Siegvolck, 1753 edition) | `everlastinggospe00sieg` | 273,231 | 9 | 226,334 | 1753 type, 10.2% unknown words; by parts |
| 16 | `x-wst` | The Mysterie of God (1648) and The Law of Freedom (1652) (Gerrard Winstanley) | `ldpd_6420628_000`, `bim_early-english-books-1475-1640_the-law-of-freedom-in-a-_winstanley-gerrard_1652` | 326,193 | 13 | 311,239 | The Mysterie of God (the Archive record gives 1649) and The Law of Freedom (1652); scans from early-English-books microfilm (10.2% unknown words); the bookseller’s list at the end cut |
| 17 | `x-far` | Eternal Hope: Five Sermons in Westminster Abbey (Frederic W. Farrar, 1878) | `eternalhope0000fred` | 365,312 | 18 | 338,799 | the twelfth thousand, with the long prefaces to the later thousands |
| 18 | `x-jkd` | The Second Death and the Restitution of All Things (Andrew Jukes, 1867) | `seconddeathandr03jukegoog` | 300,878 | 15 | 268,930 | the title page: “with some preliminary remarks on the nature and inspiration of Holy Scripture. A letter to a friend” |
| 19 | `x-prc` | An History of the Corruptions of Christianity (Joseph Priestley, 1782; 1871 edition) | `bub_gb_E5IPAAAAIAAJ` | 1,422,279 | 53 | 1,353,811 | the whole book (Rutt’s text with notes, printed by the British and Foreign Unitarian Association; with the “considerations” extracted from Priestley’s replies to Bishop Horsley and others); by Part |
| 20 | `x-pdt` | A Discourse of the Transient and Permanent in Christianity (Theodore Parker, 1841) | `transientpermane1907park` | 72,481 | 3 | 62,834 | the 1907 American Unitarian Association reprint; the association’s advertisements cut |
| 21 | `x-chw` | The Works of William E. Channing (one-volume edition, 1877) | `worksofwilliamec00chaniala` | 4,967,178 | 167 | 4,131,647 | one volume of 4.1 MB cut into its sixty-odd pieces by its own printed contents; the index cut at its first entry |
| 22 | `x-cuk` | Unitarianism in America: A History of Its Origin and Development (George Willis Cooke, 1902) | `PG8605` | 877,649 | 25 | 804,444 | Project Gutenberg 8605, typed: the twenty chapters |
| 23 | `x-bsl` | Lecture Sermons (Hosea Ballou, 1818) | `aserieslectures03ballgoog` | 849,864 | 29 | 734,611 | the title page reads “A Series of Lecture Sermons delivered at the Second Universalist Meeting, in Boston” (1818); a Schenectady sermon follows; 7.9% unknown words; by parts |
| 24 | `x-wlb` | Life of Rev. Hosea Ballou (Thomas Whittemore, 1854–55), four volumes | `lifeofrevhoseaba01whit`, `lifeofrevhoseaba02whit`, `liferevhoseabal01whitgoog`, `liferevhoseabal00whitgoog` | 3,459,378 | 137 | 2,996,081 | four volumes; the list’s guessed identifiers for volumes 3 and 4 do not exist: `liferevhoseabal01whitgoog` is volume 3 and `liferevhoseabal00whitgoog` volume 4 (found by one search); chapters; the indexes cut |
| 25 | `x-gle` | The Gleaner (Judith Sargent Murray, 1798), three volumes | `gleanermiscellan01murr`, `bim_eighteenth-century_the-gleaner-a-miscellan_murray-judith-sargent_1798_2`, `bim_eighteenth-century_the-gleaner-a-miscellan_murray-judith-sargent_1798_3` | 2,227,573 | 78 | 1,982,708 | three volumes; volumes 2 and 3 are scans whose OCR kept the printed long s as the letter ſ, which the builder now turns into s (new spec flag `unlong`); 10.3% unknown words; the list of subscribers is kept |
| 26 | `x-obr` | Acquaintances, Old and New, among Reformers (Olympia Brown, 1911) | `acquaintancesol00browgoog` | 133,220 | 13 | 124,520 | twelve chapters; the table of contents kept as the introduction |
| 27 | `x-jld` | The Revelation of Revelations (1683) and The Enochian Walks with God (1694) (Jane Leade) | `bim_early-english-books-1641-1700_the-revelation-of-revela_lead-jane_1683`, `bim_early-english-books-1641-1700_the-enochian-walks-with-_lead-jane_1694` | 402,358 | 16 | 381,474 | microfilm scans, the roughest of the round (13.1% unknown words); the end cut where the OCR turns to noise |
| 28 | `x-cox` | Salvator Mundi; or, Is Christ the Saviour of All Men? (Samuel Cox, 1877) | `salvatormundiori00coxsrich` | 480,519 | 13 | 319,608 | by parts; the publisher’s list of books cut |
| 29 | `x-all` | Universalism Asserted (Thomas Allin, 1885) | `universalismass08alligoog` | 419,132 | 16 | 402,518 | ten chapters |
| 30 | `x-bec` | History of Opinions on the Scriptural Doctrine of Retribution (Edward Beecher, 1878) | `historyopinions01beecgoog` | 601,278 | 28 | 554,710 | chapters (some headings unread, so a few chapters run together) |
| 31 | `x-wpb` | The Winchester Profession (the Universalist Convention, 1803) | `ccel.org/ccel/schaff/creeds1.x.xviii.html` | 29,155 | 2 | 1,312 | a builder of its own (`texts_round25c.build`, registered in `build_texts.py`): only the 1803 Profession and the 1899 Conditions of Fellowship; the CCEL page is from a later revision of Schaff (it mentions 1930), so the paragraphs around the documents are left out |

**Corrections to the list found in the scans.** (1) `x-bsh`: the scan is the first edition of 1824, not an 1832 printing. (2) `x-wlb`: volumes 3 and 4 have other identifiers than the guessed ones (see the table). (3) `x-wmh`: volume I of the second edition only; the complete 1830 edition is a separate scan not yet fetched. (4) `x-hci`: the title page names the author, Joseph Huntington (the draft note said his name was unknown). (5) `x-mrl`: the continuation is by “a friend” on the title page; Judith Sargent Murray entered the copyright. (6) `x-wpb`: the CCEL page is from a later revision of Schaff (1930 is mentioned), so only the two documents are kept: the 1803 Profession and the 1899 Conditions of Fellowship (the documents are of 1803 and 1899; the editor’s paragraphs mention 1930, so they come from a revision after Schaff’s death). The rest of the list was right: no scan was lending-only and every identifier answered.

**Text quality.** The seventeenth- and eighteenth-century scans (`x-wur`, `x-cmh`, `x-hci`, `x-sie`, `x-gle`, `x-wst`, `x-jld`; 5 to 13 words in a hundred are not in the vocabulary after the long-s repair) are readable but rough, and say so in their notes (the Masonic round’s sentence). A typed Text Creation Partnership copy (the `tcp` row) would replace them with clean text: that needs a TEI reader and the maker’s go-ahead. The nine Unitarian and doctrine-from-outside texts (`x-far`, `x-jkd`, `x-cox`, `x-all`, `x-bec`, `x-prc`, `x-pdt`, `x-chw`, `x-cuk`) are built and labelled; dropping them would take their lines out of the Library block, the Path and the shelf parts.

**Not done (asks for the maker’s yes).** (a) The printed-page marks: the Archive’s page data for the 39 Archive items behind the texts (106 files, 82.5 MB: 27 items have the three small files, 12 Google scans the heavier `_djvu.xml` and `_scandata.xml`; `tools/texts_pages.py`) were not fetched, so these texts have no page marks yet (the maker’s rule is that every text keeps its printed pages: round 24 asked for the same yes). Cooke (`x-cuk`, Gutenberg) needs Gutenberg’s web edition, and the Winchester Profession has none. (b) The complete 1830 first edition of Whittemore’s Modern History. (c) Typed TCP copies of the 18th-century scans.

**At integration (the project manager).** `python3 build_atlas.py` (the `library_about.json` links), then `node tools/passage_index.js`, `passage_pool.js` and `passage_words.js` (`tests/passage-filter.test.js` pins the count of typed books and of books in the page pool: the new texts add 31 scans/typed texts), `node tools/make_downloads.js`, Find similar once, `build.py`; `tests/atlas-texts.test.js` pins 2,307 Atlas text records and is unaffected (no Atlas text record was added).


## 13. Rounds 25 and 26 looked up (24 November 2026)

Added on the maker’s words of Monday 23 November 2026 (“we have a day and 6 hours so keep moving at a rate for that amount of credits”): the child session that built round 25c looked up the rows of rounds 25 and 26 that were still unresolved, so that one answer (“Fetch now”) can take a whole batch, as it did for 25c. **Nothing was fetched into the project, built or catalogued.** The work was read-only: 37 searches of the Internet Archive’s catalogue (its search address returns a small list as JSON) and 38 reads of an Archive item’s own record (the JSON that lists its files and their sizes), 75 requests in all, one at a time, six seconds apart, none refused; the Project Gutenberg catalogue was read from the copy already on disk (`tools/cache/gutenberg/pg_catalog.csv`). The sizes below are therefore the size of each item’s OCR text file as the Archive records it (`size_basis` “read”, `checked` R), not estimates, except Walden (a Gutenberg estimate). `COLLECTION_NEXT.csv` carries every row with its source, size, rights and caution.

**Round 25: 25 texts, 18.4 MB of text** (14 rows resolved today, 11 that were already resolved and now carry a measured size or stay as they were). The last column is the Archive’s page data for the printed-page marks (the same three small files, or for a Google scan the heavier `_djvu.xml` and `_scandata.xml`, as for round 25c); “not read” means the record was not opened today (Gutenberg’s typed Walden takes its page numbers from Gutenberg’s web edition, which a yes for the Archive does not cover).

| id | Work and edition | Source | Text | Page data |
|---|---|---|---|---|
| `a-yum` | Yuman and Yaqui Music (Densmore, Bureau of American Ethnology Bulletin 110) | archive: `yumanyaquimusic00dens` | 0.40 MB | 0.2 MB |
| `a-men` | Menominee Music (Densmore, BAE Bulletin 102) | archive: `menomineemusic00dens` | 0.53 MB | 0.2 MB |
| `a-sou` | Source Material for the Social and Ceremonial Life of the Choctaw Indians (Swanton, BAE Bulletin 103) | archive: `sourcematerialfo00swan` | 0.93 MB | 0.4 MB |
| `a-ori` | Origin Myth of Acoma and Other Records (Stirling, BAE Bulletin 135) | archive: `originmythofacom00stir` | 0.39 MB | 0.2 MB |
| `p-cpp` | A Fiery Flying Roll (Abiezer Coppe, 1649; facsimile) | archive: `fieryflyingroll00coppuoft` | 0.11 MB | not read |
| `e-asa` | The Asatir: The Samaritan Book of the Secrets of Moses (M. Gaster) | archive: `in.ernet.dli.2015.515698` | 0.80 MB | 8.3 MB |
| `e-gas` | The Samaritans: Their History, Doctrines and Literature (M. Gaster) | archive: `samaritanstheirh00gast` | 0.58 MB | 0.3 MB |
| `e-mos` | The Samaritans, the Earliest Jewish Sect (J. A. Montgomery) | archive: `samaritansearlie00montuoft` | 0.85 MB | 0.4 MB |
| `e-ini` | Mystic Treatises by Isaac of Nineveh (A. J. Wensinck) | archive: `isaac_of_nineveh_mystical_treatises` | 0.96 MB | 0.4 MB |
| `x-igo` | The Tale of the Armament of Igor (L. A. Magnus) | archive: `taleofarmamentof00magnuoft` | 0.45 MB | 0.2 MB |
| `x-dns` | The Metrical Dindshenchas (Edward Gwynn, Todd Lecture Series): two of the volumes | archive: `metricaldindsenc04royauoft`, `metricaldindsenc02royauoft` | 1.22 MB | 0.6 MB |
| `x-cbn` | The Conception of Buddhist Nirvana (T. Stcherbatsky) | archive: `in.ernet.dli.2015.49734` | 0.93 MB | 0.5 MB |
| `x-suh` | The Friendly Epistle (Suhrllekha) of Nagarjuna (H. Wenzel) | archive: `WenzelSuhrllekha` | 0.07 MB | 0.6 MB |
| `x-tuk` | The Life of Tukaram (Mahipati, tr. J. E. Abbott) | archive: `dli.ernet.238087` | 0.74 MB | 0.3 MB |
| `x-ekn` | Life of Eknath (Mahipati, tr. J. E. Abbott) | archive: `in.ernet.dli.2015.506109` | 0.56 MB | 0.2 MB |
| `a-raf1` | The History of Java, vol. 1 (T. S. Raffles) | archive: `b22012382_0001` | 1.57 MB | 0.6 MB |
| `x-emn` | Emerson: Nature; Addresses, and Lectures (1849), with the Divinity School Address of 1838 | archive: `natureaddresses01emergoog` | 0.48 MB | 4.9 MB |
| `x-wal` | Walden (H. D. Thoreau) | Gutenberg PG 205 | 0.65 MB | not read |
| `e-m07` | Cyril of Jerusalem and Gregory Nazianzen (NPNF II, vol. 7) | archive: `niceneandpostnic07unknuoft` | 2.97 MB | 1.3 MB |
| `e-bn2` | The Rule of St. Benedict (second translation, so the Library has one that rests on its date alone) | archive: `ruleofstbenedict0000unse_h4o5` | 0.28 MB | 0.1 MB |
| `x-mmy` | Manual of a Mystic | archive: `manualofmysticbe00wood` | 0.36 MB | not read |
| `x-vem` | The Verses of Vemana | archive: `in.ernet.dli.2015.367308` | 0.28 MB | not read |
| `x-pan` | The Panchatantra | archive: `Panchatantra_Arthur_W_Ryder` | 0.57 MB | not read |
| `x-her3` | Hermetica, vol. 3: Notes on the Corpus Hermeticum (Walter Scott, Oxford 1926) | archive: `hermetica0003walt` | 1.70 MB | not read |
| `x-chd` | The Chaldaean Oracles (G. R. S. Mead, 1908) | archive: `chaldanoraclesv00theugoog` | 0.08 MB | not read |

**Cautions that go with the table** (each is in the row’s `notes`). (1) The title page of every DLI (Digital Library of India) scan and private upload has to be read before building, as in round 24: `x-cbn` (Stcherbatsky’s Nirvana) may be a later reprint of the 1927 book, `e-ini` (a private upload of Wensinck’s 1923 Isaac of Nineveh) may be the 1967 reprint, `x-tat` and `x-jn1` (below) carry no date in the record. (2) `x-dns` is partial: of Gwynn’s five volumes the Archive has two under the University of Toronto names (items 02 and 04); items 01 and 03 do not exist, and the fifth volume (1935) would not be public domain by date. (3) `e-asa`, `x-igo`, `x-suh`, `x-dns`, `e-ini` carry Samaritan Hebrew, Cyrillic, Tibetan, Irish or Syriac next to the English; those scripts come through the OCR as noise and the builder keeps the English. (4) `e-m07` is the one volume of the second Nicene series the Library lacks (there is no catalogue line for it yet); at 2.97 MB it is the largest text of the list. (5) `a-raf1` is the 1817 first edition, like the Library’s volume II (`a-raf`); Gutenberg also lists “The History of Java, v. 1-2” as ebook 49843 (typed): if it is the same edition it would replace the OCR of both volumes, to look at before building. (6) `x-emn` is the 1849 volume, which holds the Divinity School Address of 1838, the address that divided the Unitarians; it belongs beside the Library’s Unitarian shelf. (7) `x-tuk` was first published in 1930 and became free on 1 January 2026.

**Dropped or left open, and why.** `The Samaritan Liturgy` (Cowley, 1909) is dropped: its two volumes are the Samaritan Hebrew and Aramaic text with an English introduction and no translation. `The Nestorian Monument in China` (Saeki) is dropped: it is already in the Library as `e-nes`. Left open because the Archive has no copy found by title: Whitley Stokes’s Second Battle of Moytura (the Archive holds only Wilde’s papers of 1864 and 1866; Lady Gregory’s retelling is in the Library), Hermannsson’s Book of the Icelanders (1930: the Archive has only the Icelandic editions), the Kumulipo (Liliuokalani, 1897: only her Hawaii’s Story), the Kojiki (Chamberlain 1882: the supplement to volume 10 of the Transactions of the Asiatic Society of Japan; the item found holds volume 8), the Azusa Street paper (no copy), and Malinowski’s Baloma (a journal article). Sacred Texts has the Kojiki, the Kumulipo and Baloma but refuses scripts (403), and the Kano Chronicle and the Azusa Street paper are PDFs; those five still need a builder or a different source, and are not in the figures above.

**Round 26: 9 texts, 8.1 MB of text** from the 36 rows. Eight rows turned out to be in the Library already and were closed (`Jastrow` = `x-jrb`; Langdon’s Sumerian texts = `x-sum`; the Books of the Dead = `x-bdt` and `x-bod`; Legge’s Shu King = `x-doc`; the Atharva-Veda = `x-ath` and `x-abv`; the Pahlavi texts = `x-pah`; Erman’s Literature = `x-erm`; Legge’s Analects, Mencius and Great Learning = `x-ana`, `x-men`, `x-gl`). Abbott and Godbole’s Stories of Indian Saints (1933 and 1934) moved to the dated list (`jan2029`): it is not public domain by date. The Jain volume row was split in two and **fills a catalogue entry that has no text: `x-tat`, the Tattvartha Sutra** (volume 2 of the Sacred Books of the Jainas).

| id | Work and edition | Source | Text | Page data |
|---|---|---|---|---|
| `x-tat` | Tattvartha Sutra (Umasvati), in the Sacred Books of the Jainas, volume 2 | archive: `in.ernet.dli.2015.287470` | 0.35 MB | 3.5 MB |
| `x-jn1` | Dravya-sangraha (Nemichandra), in the Sacred Books of the Jainas, volume 1 | archive: `in.ernet.dli.2015.91410` | 0.50 MB | 5.1 MB |
| `x-osc` | A Grammar of Oscan and Umbrian, with the Iguvine Tables | archive: `grammarofoscanum00buckuoft` | 0.93 MB | 0.4 MB |
| `x-sbr` | The Religion of the Ancient Babylonians: the Hibbert Lectures of 1887 (A. H. Sayce) | archive: `lecturesontheori00saycuoft` | 1.32 MB | 0.5 MB |
| `x-syh` | The Hittites: The Story of a Forgotten Empire (A. H. Sayce) | archive: `hittitesstoryoff00saycuoft` | 0.27 MB | 0.1 MB |
| `x-pym` | The Divine Pymander of Hermes Trismegistus (J. Everard, 1650; 1884 reprint) | archive: `b2487839x` | 0.23 MB | 0.1 MB |
| `a-saf` | The Useful Plants of the Island of Guam (with an introduction on the Chamorro) | archive: `usefulplantsofis00saffrich` | 1.61 MB | 0.7 MB |
| `x-sae` | The Religions of Ancient Egypt and Babylonia (A. H. Sayce, Gifford Lectures 1902) | archive: `religionsofancie00saycuoft` | 1.15 MB | 0.5 MB |
| `x-scu` | The Cuneiform Inscriptions and the Old Testament (Schrader, 2 vols) | archive: `cuneiforminscrip01schruoft`, `cuneiforminscrip02schruoft` | 1.75 MB | 0.8 MB |

**Round 26 rows still not looked up or left to the maker.** The Cambridge Ancient History, volumes I to VIII (the Archive has them under many identifiers: `cambridgeancient03buryuoft` and `05buryuoft` are volumes 3 and 5, `in.ernet.dli.2015.70247`, `.70250`, `.70252` and `.125959` are volumes 3, 5, 8 and 7; each must be matched to its volume and year, and it is general ancient history rather than religion, so whether the Library wants it is the maker’s call); Maspero’s Dawn of Civilization, Wright’s Empire of the Hittites and Jastrow’s Civilization of Babylonia and Assyria (history rather than religion; the Archive has all three, many times); Renouf and Naville’s Book of the Dead (found, `egyptianbookofde00reno`, but a third Book of the Dead); Langdon’s Babylonian Liturgies; the Sacred Books of the Jainas, volume 4 (not among the first ten of 34 search results); and Plato’s Dialogues, Aeschylus, Sophocles, Pindar and Julian from Gutenberg (classical literature, whether the Library holds it is again the maker’s call).

**What one “Fetch now” would take.** Texts: round 25 (25 texts, 18.4 MB) and the nine resolved texts of round 26 (8.1 MB), 34 texts and 26.5 MB, one request at a time as before (about 36 Archive items and Gutenberg files, two requests each, the record and then the text, six seconds apart: about 8 minutes of waiting and then the transfers). Page data for them (the maker’s rule is that every text keeps its printed pages): 31.3 MB for the 27 rows whose records were read, and about 2 MB more for the six older identifiers. The page data of round 25c is a separate 82.5 MB (the 39 Archive items behind its 31 texts, 106 files: 27 items with three small files and 12 Google and other scans with the heavier files). **All the page data together: about 115 MB.** Typed Text Creation Partnership copies of the seven rough 18th-century scans and the complete 1830 Whittemore are not in these figures.

**Round 25b measured too.** The 26 item records of the Journal of Discourses (`JoDV01` to `JoDV26`) were read the same way: **38.75 MB of OCR text** (1.32 to 1.62 MB a volume; the estimate of 41.6 MB was 7% high), 26 texts, one per volume. Page data: 22 volumes have the three small files (12.4 MB together); volumes 2, 3, 4 and 10 would need the heavy `_djvu.xml` and `_scandata.xml` (14 MB each, 57 MB together), so the maker may prefer to give those four volumes no page marks, or to take them last. With round 25b the whole batch is **60 texts, 65.3 MB of text**, and its page data is about 115 MB (the 25c, 25 and 26 parts above) plus 12.4 to 69 MB.

## 14. Rounds 25, 25b and 26 built (24 November 2026)

The maker answered **“Fetch all”** (Tuesday 24 November, about 00:40 their time) to the question at the end of section 13, and the child session that built round 25c fetched and built the batch. **58 texts are in `texts/` (55.3 MB of files, 54.5 million characters, 2,503 sections); the Library went from 1,479 to 1,537 texts and from 1,592 to 1,649 catalogue entries; nothing was committed.** The specs are `lamplighter/tools/texts_round25.py` (registered at the end of `texts_archive.py`); the Library lines end the Library block of `src/js/24-data-path-lib.js`; the Path entries are in the station files; the shelf parts are in `src/js/2z-subshelves-core.js` (a new part for the Journal of Discourses, 16 books added to 15 parts, 14 blurbs extended); 12 Atlas text records are tied to the new texts in `tools/atlas_text_aliases.json` and 25 books to their traditions in `tools/library_about.json` (the Atlas needs `build_atlas.py`).

**What was fetched.** Only the OCR text of each Internet Archive item (61 records of 1.9 MB and 63 text requests of 65.3 MB) and Project Gutenberg 205 (Walden) through the pglaf mirror, one request at a time, six seconds apart. One network timeout (the text of the Journal’s volume 2, after 120 seconds) stopped the source as the fetcher’s rule says; it was resumed after four minutes with a longer read timeout and every later request answered.

**The 23 texts of round 25 and the 9 of round 26** (sections; size in the Library; share of words the English vocabulary does not know after the repair pass, which is high where the book prints Irish, Oscan, Sanskrit or Greek):

| id | Work | Shelf | Sections | Size | Unknown words |
|---|---|---|---|---|---|
| `e-asa` | The Asatir: The Samaritan Book of the “Secrets of Moses” (Moses Gaster, 1927) | ju | 25 | 0.63 MB | 4% |
| `x-gas` | The Samaritans: Their History, Doctrines and Literature (Moses Gaster, 1925) | sc | 23 | 0.53 MB | 6% |
| `x-smt` | The Samaritans, the Earliest Jewish Sect (James A. Montgomery, 1907) | sc | 30 | 0.70 MB | 7% |
| `e-ini` | Mystic Treatises by Isaac of Nineveh (A. J. Wensinck, 1923) | ec | 35 | 0.89 MB | 1% |
| `x-igo` | The Tale of the Armament of Igor (Leonard A. Magnus, 1915) | sc | 13 | 0.33 MB | 16% |
| `x-dns` | The Metrical Dindshenchas, parts II and IV (Edward Gwynn) | ne | 31 | 0.76 MB | 22% |
| `x-tuk` | Tukaram: a translation from Mahipati’s Bhaktalilamrita (Justin E. Abbott, 1930) | in | 19 | 0.61 MB | 6% |
| `x-ekn` | Eknath: a translation from Mahipati’s Bhaktalilamrita (Justin E. Abbott, 1927) | in | 17 | 0.47 MB | 6% |
| `a-raf1` | The History of Java (Sir T. S. Raffles, 1817), volume I | tb | 54 | 1.29 MB | 7% |
| `x-emn` | Nature; Addresses, and Lectures (Ralph Waldo Emerson, 1849) | mo | 13 | 0.45 MB | 3% |
| `x-wal` | Walden, and On the Duty of Civil Disobedience (Henry David Thoreau, 1854) | mo | 24 | 0.63 MB | 1% |
| `a-yum` | Yuman and Yaqui Music (Frances Densmore, 1932) | tb | 15 | 0.36 MB | 9% |
| `a-men` | Menominee Music (Frances Densmore, 1932) | tb | 19 | 0.48 MB | 9% |
| `a-sou` | Source Material for the Social and Ceremonial Life of the Choctaw Indians (John R. Swanton, 1931) | tb | 34 | 0.87 MB | 9% |
| `a-ori` | Origin Myth of Acoma and Other Records (Matthew W. Stirling, 1942) | tb | 15 | 0.37 MB | 6% |
| `x-cpp` | A Fiery Flying Roll (Abiezer Coppe, 1649) | mo | 4 | 0.09 MB | 29% |
| `e-bn2` | The Rule of Saint Benedict (D. Oswald Hunter Blair, 1914) | ec | 73 | 0.25 MB | 13% |
| `x-mmy` | Manual of a Mystic: the Yogavachara’s Manual (F. L. Woodward, 1916) | bu | 11 | 0.28 MB | 4% |
| `x-vem` | The Verses of Vemana (C. P. Brown, 1829; 1911 edition) | in | 7 | 0.18 MB | 6% |
| `t-pan` | The Panchatantra (Arthur W. Ryder, 1925) | ta | 22 | 0.55 MB | 1% |
| `x-tat` | Tattvartha Sutra (Umasvati), with J. L. Jaini’s translation and commentary (Sacred Books of the Jainas, vol. 2, 1920) | ja | 12 | 0.30 MB | 19% |
| `x-jn1` | Dravya-samgraha (Nemichandra), in the Sacred Books of the Jainas, vol. 1 (Sarat Chandra Ghoshal, 1917) | ja | 15 | 0.38 MB | 29% |
| `h-her3` | Hermetica, volume III: Notes on the Asclepius and the Stobaean Excerpts (Walter Scott, 1926) | he | 64 | 1.63 MB | 20% |
| `h-chd` | The Chaldaean Oracles, volume I (G. R. S. Mead, 1908) | he | 3 | 0.07 MB | 5% |
| `e-m07` | Cyril of Jerusalem and Gregory Nazianzen: select writings (NPNF II, vol. 7) | ec | 111 | 2.83 MB | 5% |
| `x-osc` | A Grammar of Oscan and Umbrian (Carl Darling Buck, 1904) | sc | 30 | 0.77 MB | 33% |
| `x-sbr` | The Religion of the Ancient Babylonians: the Hibbert Lectures of 1887 (A. H. Sayce) | sc | 40 | 1.03 MB | 4% |
| `x-syh` | The Hittites: The Story of a Forgotten Empire (A. H. Sayce, 1890) | sc | 9 | 0.20 MB | 3% |
| `h-pym` | The Divine Pymander of Hermes Trismegistus (John Everard, 1650; 1884 reprint) | he | 8 | 0.19 MB | 2% |
| `x-sae` | The Religions of Ancient Egypt and Babylonia: the Gifford Lectures (A. H. Sayce, 1902) | sc | 38 | 0.94 MB | 2% |
| `a-saf` | The Useful Plants of the Island of Guam (William Edwin Safford, 1905) | tb | 52 | 1.32 MB | 17% |
| `x-scu` | The Cuneiform Inscriptions and the Old Testament (Eberhard Schrader, 1885–88), two volumes | sc | 50 | 1.27 MB | 12% |

**Round 25b: the Journal of Discourses, volumes 1 to 26** (`x-jd01` to `x-jd26`): 26 texts of 1.2 to 1.3 MB, 1,587 sections in all, 1.5 to 3.4% unknown words (the cleanest scans of the batch). Each volume is cut into its discourses by the title that runs at the head of their pages (`_jod_sections`; the first section of a volume is its title page, contents and first discourse); titles are as the scan gives them, so some are misread. All 26 are read at the Path station of the nineteenth-century movements and in one shelf part; each note says that they are the sermons of one church’s leaders and not its scripture, that some of the teachings reported were later set aside or disavowed by the church (the Adam–God teaching; plural marriage, ended in 1890 and 1904), and that the church’s own present statements are the place to see what it teaches.

**Dropped after the scans were read.** Wenzel’s Suhrllekha (`x-suh`) is a German article (the Tibetan text with a German translation), not English; the Digital Library of India scan of Stcherbatsky’s Conception of Buddhist Nirvana (`x-cbn`) is the Bharatiya Vidya Prakashan “revised and enlarged edition” with a modern editor’s analysis (in copyright), and the 1927 original was not found open. **Renamed from the plan:** `e-gas`→`x-gas`, `e-mos`→`x-smt` (`x-mos` and `x-smo` are taken: check an id against `LIB` before choosing it), `p-cpp`→`x-cpp` (a movement, group `mo`, not `ps`), `x-pan`→`t-pan`, `x-her3`→`h-her3`, `x-chd`→`h-chd`, `x-pym`→`h-pym` (the wider shelves keep their id prefixes, as `tests/path.test.js` requires), `x-osc` moved from `gr` to `sc`.

**Rights, as read from the Archive’s own records.** All first published before 1931 (the one of 1930, Abbott’s Tukaram, became free on 1 January 2026); the four Bureau of American Ethnology bulletins are United States Government publications whose Archive copies carry a copyright review finding them in the public domain according to the HathiTrust rights database; the Coppe scan is a 1973 facsimile whose modern publisher’s note (a copyright work) was cut; Emerson’s and Thoreau’s texts, the Everard reprint of 1884 and the others are of their old editions.

**Page data and printed-page marks (the maker’s “Fetch all” covered them).** `polite_pages.py` (a scratch fetcher: one request at a time, light items first, the heavy `_djvu.xml` files last) fetched the Archive’s page data for the 88 texts of rounds 25c, 25, 25b and 26: 272 of 273 files, about 193 MB. The Archive closed the connection without an answer several times (seven stops in all); each time the source was rested (four minutes, then twenty, then fifteen) and the pause between requests was raised from six to twenty seconds. One item was left out after it failed twice at the same file (`metricaldindsenc02royauoft`, the second part of the Dindshenchas, so `x-dns` has no marks). **Printed-page marks are built for 84 of the 88 texts: 81 of grade a and 3 of grade b (`t-pan`, `x-jn1`, `x-vem`)** (`tools/texts_pages.py build`, files `texts/pg-<id>.js`); the Library now has 1,191 texts with printed pages (1,107 before round 25c). The four without: `x-cpp` (the Coppe facsimile: the Archive read no leaf of it), `x-dns` (above), and the two typed Gutenberg texts `x-wal` (Walden) and `x-cuk` (Cooke), whose page numbers come from Gutenberg’s web editions, which the yes did not cover.

**Tests.** All 112 files pass except the three pinned counts of `tests/passage-filter.test.js` (the typed pool is now 199 books and the page pool 763; the PM regenerates the passage index, pool and word list and updates the pins). Four test files were changed: `passage.test.js` (it kept every text in memory and ran out of node’s 4 GB heap at 1,537 texts: it now lets go of each text when its checks are done), `subshelves.test.js` (the Jewish shelf holds 38), and `alpha-fixes-a.test.js` and `alpha-fixes-c.test.js` (the sentence about the size of a search of every text now says 1.7 GB).

**At integration (the project manager).** `python3 build_atlas.py`, then `node tools/passage_index.js`, `passage_pool.js`, `passage_words.js` and the three pins, `node tools/make_downloads.js`, Find similar once (groups touched: `ju` e-asa; `ne` x-dns; `in` x-tuk, x-ekn, x-vem; `bu` x-mmy; `ja` x-tat, x-jn1), `python3 build.py`, the full test run (`passage.test.js` takes 3.5 minutes).

## 15. The collection declared complete for the alpha (24 November 2026)

The maker answered the question of releasing the alpha with “ok lets do what you think we should do first. i want people on phones and laptops to be able to see it on facebook and go try it for themselves.” That is a yes to preparing the alpha release, and it names the audience: the public, by a link, not friends only. The collection is therefore **complete for the alpha**: no new round starts before the release; whatever is not built stays on the list as later work, nothing is removed, and the quality pass (ROADMAP.md, Q0 to Q5) is the planned way to refine the texts afterwards.

What the list holds on this date (COLLECTION_NEXT.csv, 653 rows, counted by `row_type`): 263 `tradition` and 115 `entry` rows, which are records of gaps (a tradition or a work with no free English text, each with its reason, some with a possible source); 143 `text` rows (rounds 24 to 26 are built; about 20 are not: the eight volumes of the Cambridge Ancient History, five classics found by title on Gutenberg, six titles not yet looked up, and the Sacred Texts and PDF rows); 58 `replace` rows (57 of them round 28: a rough scan to swap for a better copy, which is the quality pass's Q1); 33 `renewal` rows (post-1930 books to check for a missed renewal) and 17 `date-gated` rows (books that enter the US public domain on 1 January of 2027 to 2030); 15 `resource` and 9 `decision` rows.

Still the maker’s, unchanged: typed Text Creation Partnership copies for the rough 18th-century scans, the complete 1830 Whittemore, the Sacred Texts rows (Kojiki, Kumulipo, Baloma) and the two PDF rows (Kano Chronicle, Azusa Street), Atlas rows for the Universalist Church of America and Christian universalism, and whether the Library wants general ancient history and the classics at all.
