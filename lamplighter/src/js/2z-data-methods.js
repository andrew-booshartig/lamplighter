/* ═══════════════════════════ 2z · Methods and standards: the lists that grow with the project ═══════════════════════════
   The page at #/methods (6zze-methods.js, its rules and builders in 2z-methods-core.js) is written once; what changes from release to release is kept here, in a few short lists, so that the person
   who does an integration (or ends a reading) extends this file and nothing else. tests/methods.test.js holds every number below against the data files that carry it, so a list that falls behind fails.

   METH_LOG       every reading so far, newest first: what was checked, how many items were read, how many changed, the date, and what changed. Add a row when a reading ends. A visitor has no working
                  notes, so a row says what it needs to say itself. `read` and `changed` are numbers (for the table’s words, `readText` and `changedText` may say what was counted); `readOf` is the size of
                  what could have been read, where that is one number.
   METH_STAGES    where each part of the app stands today. `total` is what the part holds; `second` and `first` count items that have had a second reading and a first reading only (0 where a part is not
                  counted that way); `stands` says it in words, with the date.
   METH_RELEASES  what changed in each release, newest first, in plain words. The first entry may have no `stamp` (it is the release this file is part of, and its stamp is only known once that release is
                  built); at the next integration give that entry its stamp and its date, and put a new first entry above it.
   METH_EXAMPLES  one real entry of the History timeline for each label (documented, reported or claimed, disputed), shown on the page as it stands in the data.
   METH_WHO       one sentence on who wrote and who read, so that a reader knows what “a second reading” is. */
const METH_LOG = [
  { id: 'causes3', date: '2026-11-22', what: 'The last 91 of the 179 cause rows of Compare traditions, Step by step, read against the whole text of the pages each cites, 16 of them also against the Library’s own texts', read: 91, readOf: 91, readUnit: 'rows', changed: 56, changedUnit: 'rows',
    result: '56 rows were corrected or narrowed: among them the Senate’s decree of 186 BCE on the Bacchanalia (it set limits and did not ban the worship), the 1890 Manifesto (it prohibited new plural marriages and did not end the practice), the capture of Frumentius (no shipwreck), the year of the pope’s commission of Boniface, the sentence passed on Kimbangu, Maimonides’ Guide (no Latin of the 1230s) and the conversion of Cakobau; a sentence the pages did not bear out was taken out of many more. 10 rows had a source added, and 25 were found as written. No row was removed, and no “documented”, “reported” or “disputed” label and no “sure” or “less sure” mark was changed. With this reading every one of the 179 rows has had a second reading by another reader; none has been read by a specialist.' },
  { id: 'history2b', date: '2026-11-22', what: 'The 108 events of the History timeline in the strands ideas and arts, science and technology, and disease and disaster that had a first reading only, read against the pages each cites and, for 15 of them, against a second source', read: 108, readOf: 207, readUnit: 'events', changed: 37, changedUnit: 'events',
    result: '12 were corrected (a statement, a date, a place or the title of an entry was wrong, unsupported or one-sided), 17 were made more exact or even-handed, and 8 had a source address or title fixed. No label (documented, reported or claimed, disputed) was changed; one date confidence was (the Igbo-Ukwu bronzes, from M to L). 15 events were checked against a second source, 7 against a page that was opened and 8 by a search result only; the other 93 rest on the page they cite. With this reading every one of the 293 events has had a second reading; none has been read by a specialist.' },
  { id: 'history2a', date: '2026-11-22', what: 'The 99 events of the History timeline in the strands empires and states and trade and migration that had a first reading only, read against the pages each cites and, for those that are disputed, reported or dated 1000 BCE or earlier, or whose page was thin, against a second source', read: 99, readOf: 207, readUnit: 'events', changed: 39, changedUnit: 'events',
    result: '12 were corrected (a statement, a date, a place or a link was wrong, unsupported or one-sided), 22 were made more exact or even-handed, and 5 had a source address or title fixed. No label (documented, reported or claimed, disputed) was changed; one date confidence was (the Parthian Empire, from H to M). 25 events were checked against a second source, 11 against a page that was opened and 14 by a search result only; the other 74 rest on the page they cite. The 108 events of ideas and arts, science and technology, and disease and disaster had a first reading only on that day; the row above is their second.' },
  { id: 'groups3', date: '2026-11-22', what: 'The 24 lines of the High-control groups page that the first reading could not settle (21 claims on seven cards and three of the lines under “Not yet written up”), read again against court opinions, the groups’ own pages, news reports and reference pages that could be opened', read: 24, readOf: 24, readUnit: 'lines', changed: 17, changedUnit: 'lines',
    result: 'Of the 21 claims, 13 are now found in the page read, 6 in part and 2 are still not in the page read (the Church of Scientology’s account of Operation Snow White and the Twelve Tribes’ own head-count, which stay on the page as written, labelled); the three lines under “Not yet written up” are now found. 17 lines were corrected or narrowed (the 1984 Armstrong decision, read in its own text; the Australian royal commission’s hearing of 2015 and its report of 2016; the size of Mount Carmel in February 1993; the 46 communities on the Twelve Tribes’ own site; the dates of Synanon’s religion among them). Every one of the 156 claims has now been read. No card is marked checked: the books the claims name were not re-read, and some of the groups’ own sites and several court sites refused the reading tool.' },
  { id: 'groups2', date: '2026-11-22', what: 'The 156 claims of the 13 High-control group cards and the seven lines under “Not yet written up”, read against pages that could be opened: court opinions, Hansard, an official report and the groups’ own pages where they opened, and otherwise the encyclopedia pages that cite them', read: 147, readOf: 156, readUnit: 'claims', changed: 60, changedUnit: 'claims',
    result: 'Of the 147 claims read, 98 were found in the page read, 37 in part and 12 not in the page read (which does not make them wrong: they stay on the page as written, labelled); 60 were corrected or narrowed (the judge in the English custody case of 1995, the sentences in the Jeffs and Moon appeals, the number of children taken from the YFZ Ranch, the findings on Lisa McPherson’s death and on Operation Snow White, the sizes and dates of Aum and the Solar Temple among them). 9 claims were not read, and no card is marked checked: most claims were read in an encyclopedia page that cites their source, the books the claims name were not re-read, and several court sites refused the reading tool.' },
  { id: 'causes2', date: '2026-11-21', what: 'The 179 cause rows of Compare traditions, Step by step, second pass: 54 more rows read against the Library’s own texts, the pages the five least-sure rows cite, and the opening section of the Wikipedia page each other row cites', read: 54, readOf: 179, readUnit: 'rows', changed: 23, changedUnit: 'rows',
    result: 'The five rows marked “less sure” that nobody had opened were read, and 21 other rows were corrected or narrowed (the end of the Great Persecution, a date for Clovis, the Code Noir’s wording, the first month of the Neronian account and the Haitian campaign among them); 33 were found as written, and 2 more were changed on a search summary. No row was removed. In all 88 rows have now been read; the other 91 have not.' },
  { id: 'astrology2', date: '2026-11-21', what: 'The studies behind the Western and Chinese astrology entries, opened again where a copy could be opened', read: 4, readOf: 5, readUnit: 'studies', changed: 2, changedUnit: 'entries',
    result: 'Of the five studies the second reader was asked to open, four were opened in part: Phillips, Ruth and Wagner (1993) by their abstract (added to the Chinese entry), Voas’s study of married couples through two web pages (added to the Western entry), McRitchie’s replies to Dean and Kelly through a 2023 record and a practitioner’s review, and the citation of Goodkind (1991). Carlson (1985) could not be opened, and neither could Voas’s paper, McRitchie’s 2016 commentary or Goodkind’s text.' },
  { id: 'hermetic', date: '2026-11-18', what: 'The Hermetic Museum (Waite, 1893), one text of the Library: the machine-read scan replaced by a typed copy of the same edition', read: 1, readOf: 1, readUnit: 'text', changed: 1, changedUnit: 'text',
    result: 'Words with stray marks in them fell from 0.254% to 0.037% of the text, and the share of its text that the Random page would turn away as too damaged fell from 61% to 12.7%. The printed-page marks rose from 616 to 635: the old copy lacked four pages of the second volume, and each of the two scans the page marks were found from has pages missing too.' },
  { id: 'neutral', date: '2026-11-18', what: 'The wording of the whole app, for beliefs, visions and titles stated as fact in the tool’s own voice: the Atlas’s summaries, founders and notes, the page texts and the teasers', read: 31659, readText: 'scanned by a test: 9,959 pieces of Atlas prose and 21,700 lines of page text', changed: 121, changedText: '121: 48 Atlas values and 73 lines of page text',
    result: 'Each claim stays, now with the tradition that makes it named (“held to have been revealed”, “said to”, “in the Muslim account”), and a title became a name. A test now scans every summary, note and page text, and fails on the old wording.' },
  { id: 'causes', date: '2026-11-18', what: 'The 179 cause rows of Compare traditions, Step by step: what is said to have brought each connection about', read: 34, readOf: 179, readUnit: 'rows', changed: 42, changedUnit: 'rows',
    result: 'The 33 rows marked “less sure” came first (26 of them were read), then the rows that join the most traditions. No row was removed. Every Wikipedia address the rows cite was looked up (144 pages): ten were replaced because the page does not exist, is a list of meanings or leads somewhere else. The other 145 rows have not been read against a source.' },
  { id: 'bodies', date: '2026-11-18', what: 'High-control groups, the box of questions: the six outside bodies it names for help, the six books it draws on and the advice for someone worried about a person', read: 13, readOf: 13, readUnit: 'items', changed: 8, changedUnit: 'items',
    result: 'The line about each of the six bodies changed in some part (an address, what the body says of itself, a place or year its own pages do not give). One of the six book citations was corrected (the title of Hassan’s book), and the advice was rewritten to match what two of the bodies publish.' },
  { id: 'timeline', date: '2026-11-18', what: 'The first 86 events of the History timeline, with their dates, places, sources and labels, read against the pages each cites, and, for the 8 conflicts, 6 of the 9 disputed events and 11 of the 17 earliest, against a second source', read: 86, readOf: 86, readUnit: 'events', changed: 33, changedUnit: 'events',
    result: '23 were corrected (a date, a number or a statement was wrong, out of date or one-sided), 2 were given the basis of their range for the dead, 5 were made more exact or even-handed, and 3 had a source address fixed or a source added. No label (documented, reported or claimed, disputed) was changed; one date confidence was (the Renaissance, from M to L).' },
  { id: 'stations', date: '2026-11-16', what: 'The 137 stations of the Journey, in full, then the 49 quotations in them that could not be matched to the Library’s own words', read: 137, readOf: 137, readUnit: 'stations', changed: 63, changedUnit: 'edits',
    result: '32 corrections (dates and counts, claims stated too firmly, a quotation that was a paraphrase), 5 questions rewritten and 26 further edits to the quotations. Not part of this reading: the translations themselves, and the Atlas text records not read by hand.' },
  { id: 'database', date: '2026-11-14', what: 'The Atlas database, third pass: every record checked by machine; by hand, the dates of all 488 sites and of the 721 traditions then in the Atlas, and 280 of the 2,307 text records, chosen at random', read: 1489, readText: '1,489 records: 488 sites, 721 traditions and 280 texts', changed: 0, changedText: '0 of those',
    result: 'No error in the records read. In the same pass 3 notes in Shared ideas, 2 science citations and 2 dates in the Library were corrected, and six faults in how the app handled odd input were found and fixed.' },
  { id: 'stories', date: '2026-11-14', dateNote: 'by', what: 'Stories that travel and Rites and customs: every date, name, number and quoted line in the 10 stories (79 versions) and 26 rites then in the app, against the Library’s texts and the web', read: 105, readOf: 105, readUnit: 'versions and rites', changed: 33, changedUnit: 'entries',
    result: 'An entry that said more than the evidence allows was reworded to say what is known (for example, when birthday candles and the Christmas tree are first recorded). Some single facts could not be confirmed and were left as written.' },
];

const METH_STAGES = [
  { id: 'history', part: 'History timeline (the 293 events written by hand)', href: '#/history', total: 293, second: 293, first: 0, stands: 'All 293 events have had a second reading: 86 on 18 November 2026, and 99 and 108 on 22 November 2026 (the 99 in the empires and states and the trade and migration added after the first 86, the 108 in ideas and arts, science and technology, and disease and disaster). A second reader is not a specialist: none has been re-read by one, and no date has been checked against Wikidata.' },
  { id: 'conflicts', part: 'Conflicts and peace', href: '#/conflicts', total: 86, second: 0, first: 86, stands: 'First reading only: each source was opened and read by the author on the day shown. None has had a second reading, and none has been read by a specialist in its field.' },
  { id: 'causes', part: 'Compare traditions, Step by step', href: '#/steps', total: 179, second: 179, first: 0, stands: 'Every one of the 179 rows has had a second reading against a source by another reader: 34 on 18 November 2026, 54 on 21 November 2026 (19 against the Library’s own texts, 5 against the whole page they cite and 30 against the opening section of the Wikipedia page they cite) and the last 91 on 22 November 2026 (against the whole text of the pages they cite, 16 of them also against the Library’s own texts). None has been read by a specialist; the Wikipedia addresses in all of them were looked up.' },
  { id: 'groups', part: 'High-control groups', href: '#/traditions/movements', total: 13, second: 13, first: 0, stands: 'Each of the 13 cards is still marked “Under review”. On 22 November 2026 a second reader read all 156 claims on the cards against pages that could be opened: 111 were found in the page read, 43 in part and 2 not in the page read (those stay on the page as written, labelled, and are not thereby wrong), and 74 were corrected or narrowed. Every card has had every claim read. No card is marked checked: some claims were read in an encyclopedia page that cites their source, and the books the claims name were not re-read. The six outside bodies and six books in the box of questions had a second reading on 18 November 2026.' },
  { id: 'astrology', part: 'Astrology’s systems', href: '#/sky/astrology', total: 6, second: 2, first: 4, stands: 'The writer opened the 37 sources, in full or in part as each entry says, except five that the entries mark “not opened”. On 21 November 2026 a second reader went back to the studies behind the Western and Chinese entries and opened what could be opened; the other four entries have had no second reading.' },
  { id: 'atlas', part: 'The Atlas: traditions, texts, sites', href: '#/atlas/traditions', total: 793, second: 0, first: 0, stands: 'Written by hand from reference works, with machine checks on every record. The dates of 721 traditions and 488 sites were read through on 14 November 2026; the 72 traditions added on 17 November rest on a Library text that was read or on general knowledge, and have had no second reading.' },
];

const METH_WHO = 'So far the entries were written, and every reading in the log was made, by AI assistants working for the maker, who decides what goes in. Each second reading was made by a different working session from the one that wrote the entry. A second reading is therefore a second pass by another reader, not a specialist’s review, and the project’s records show no review by a specialist in the field for any part of it.';

const METH_EXAMPLES = { documented: 'diamond-sutra-printed', reported: 'sundiata-epic', disputed: 'library-of-alexandria' };

const METH_RELEASES = [
  { stamp: null, date: null, items: [
    'Nothing yet: the changes made after the release below are listed here when the next release is built.',
  ] },
  { stamp: '2026-11-24-1aaf56', date: '2026-11-24', items: [
    'Find similar was rebuilt: it now searches 445 texts (319,867 passages), the newest ones included; nine of the newest are left out because they crowded out the scriptures (the reasons are in the tools folder).',
    'A link to the site can show a name, a sentence and a picture on Facebook and in messages: the page carries a plain description, and the site builder adds a share picture and the tags those apps read.',
    'In the built-in browser of Facebook or Instagram the welcome says the app cannot be saved for offline use there, and Take it with you no longer says the page was opened from a file.',
    'With a contact address set, the feedback box says to email the note; and Methods and standards now says that a website’s host sees each request for the page and its files, as any website does.',
  ] },
  { stamp: '2026-11-24-7acbbd', date: '2026-11-24', items: [
    '89 texts were added: the Library now holds 1,537 readable texts in 1,649 catalogue entries, and 1,191 of them carry the printed page numbers of their edition (the pages were read for 84 of the 88 scanned or typed texts added).',
    'Among the new texts: the 26 volumes of the Journal of Discourses, 31 Universalist and Unitarian works, two volumes of the Sacred Books of the Jainas, and writings on the Samaritans, the Hittites, Babylon, Hermes and the Chaldaean Oracles.',
    'Twelve of the map data’s text records now point to Library texts, and Random’s lists and the ready-made e-book, text and Markdown files include the new texts. Find similar still searches the 419 texts it was built on.',
  ] },
  { stamp: '2026-11-23-2ce7c3', date: '2026-11-23', items: [
    'The Notebook on a phone now says how to begin when nothing is written yet: select words in any text and choose Clip to notebook, or press + to start a page.',
    'Step by step says in one plainer sentence that the causes of its 179 connections were written by hand and each read a second time by another reader, and that none has been read by a specialist.',
  ] },
  { stamp: '2026-11-23-97973f', date: '2026-11-23', items: [
    'On a phone, the pages you reach from a link (a religion’s page, a conflict, a Journey view) now have links and buttons you can hit: the back line, footnote numbers, “on the map” links and the other religion in a relationship.',
    'Plainer words on first screens: a religion’s page says “dated records”, About the map data says “presence records”, and Step by step says its causes were read for “every one of the 179 connections that have them”.',
    'A religion’s page no longer shows a stray dot over the first letters of each relationship and each text entry.',
  ] },
  { stamp: '2026-11-22-ad222f', date: '2026-11-22', items: [
    'On an iPhone, a text field no longer zooms the page when you tap it, a double tap on a button does not zoom, and dialogs fit the screen with Safari’s toolbars showing and keep clear of the notch and home bar.',
    'A dialog now closes when you go to another page, press Back or follow a link inside it, instead of staying open over the next page.',
    'On a phone, the note about a machine-read scan is one line with a More button, so the text starts higher; the reader’s ⋯ menu shows each toolbar icon beside its name.',
    'A religion’s Journey now has one name everywhere: the religion page says Journey →, the map panel says Journey, a station page says Journey for, and the way back says Journey by tradition.',
    'The religion line of History (Islam emerges and the rest) now ends with the texts and conflicts tied to that religion, like the other events; the map panel no longer repeats the religion’s own page.',
    'Step by step: eight notes in the second reading of the causes now say “entry” instead of “row”, and the note on Mormon fundamentalism says that the 1890 Manifesto prohibited new plural marriages.',
  ] },
  { stamp: '2026-11-22-7aebbe', date: '2026-11-22', items: [
    'High-control groups: every one of the 156 claims has now been read against a source: 111 found in the page read, 43 in part and 2 not in it; 74 were corrected or narrowed, and no card is marked checked.',
    'High-control groups: the 1984 Armstrong decision in the Scientology case is now stated from its own text and from the 1991 appeal, not from a summary.',
    'High-control groups: the Jehovah’s Witnesses line now gives the Australian royal commission’s hearing (2015), its report (2016) and the 2017 hearing on shunning; Synanon’s line gives the court record of its religion.',
    'High-control groups: the Twelve Tribes line now gives the 46 communities in 11 countries that the group’s own site lists; the Church of Scientology’s account of itself now rests on its own pages.',
    'Methods and standards: the High-control rows now show the second reading (24 lines read again, 17 corrected or narrowed); two claims are still not in the page read and stay as written, labelled.',
  ] },
  { stamp: '2026-11-22-c620ca', date: '2026-11-22', items: [
    'Compare traditions, Step by step: every one of its 179 causes has now been read a second time against its sources by another reader. None has been read by a specialist, and the page says so.',
    'The last 91 causes were read against whole pages, 16 of them also against the Library’s own texts; 56 were corrected or narrowed, 10 gained a source, and none was removed.',
    'The Senate’s decree of 186 BCE on the Bacchanalia now says it set limits and did not ban the worship; the Manifestos of 1890 and 1904 now say they prohibited new plural marriages.',
    'Rows on Frumentius, Boniface, Kimbangu, Maimonides’ Guide, Cakobau’s conversion and the Convention’s decree of 1793 now say only what the pages and texts read say.',
    'Methods and standards: the Step by step row now reads “all 179 have had a second reading”, and the log has a row for the last 91.',
  ] },
  { stamp: '2026-11-22-214f85', date: '2026-11-22', items: [
    'History timeline: every one of the 293 events has now had a second reading against the pages it cites; 37 of the last 108 were corrected or made more exact, and no documented, reported or disputed label changed.',
    'History: the Declaration of Independence entry now separates the vote for independence (2 July), the approval of the text (4 July) and the later word “unanimous”.',
    'History: the Igbo-Ukwu bronzes now say that their 9th-century date is contested (calibrated range 7th to 12th century; a textile dated to the 11th or 12th).',
    'History: corrected the distance of Zhang Heng’s earthquake report (400 to 500 km), the date of the Charaka revision (6th century) and the fate of Su Song’s clock tower (moved north to Beijing).',
    'History: the Müteferrika press is now the first Muslim-run press with movable Arabic type (an earlier one, run by Christians, worked in Aleppo in 1706–1711); Rapa Nui gives both accounts of the island’s depopulation.',
    'Methods and standards: the History row now reads “all 293 events have had a second reading”, none by a specialist, and the log has a row for the 108 read on 22 November.',
  ] },
  { stamp: '2026-11-22-37ecdc', date: '2026-11-22', items: [
    'A second reader checked 99 more History events (empires and states, trade and migration) against the pages they cite: 39 were changed, 12 of them corrections of fact. No label (documented, reported, disputed) changed.',
    'High-control groups: each mark now says what the reading did (Found in the page read, Part of it in the page read, Not in the page read), with a key under the count; “not in the page read” does not mean wrong. On a phone the ten questions start closed.',
    'History’s opening panel says its count once (496 events: 354 of the world, 142 of religion) and no longer uses the working words row, strand and reading; “How far each part has been read” is one link.',
    'Random’s line under Another now reads “Your key presses and taps are mixed into the draw: 0 so far”, and its About box closes when you open another page or press Back. Nothing under the button moved.',
    'A religion chip that comes only from a book’s shelf now says so: “From its shelf:”, or “The religions this text is filed with:” for a family. Farnell’s volume on the Greek states is now tied to Greek religion, Schaff’s History to Christianity.',
    'A related list with only one link is now one quiet line, such as “On the map: Nicomedia”; picture pages, stories and stations no longer list again the book, religion and texts they already show, and History event panels end without a second map link.',
    'A calendar’s related list names the religions that use it, then one line counts the traditions that are branches of them; its events are marked as listed for context, not as connected.',
    'On a phone the related list shows three items in each of three groups and keeps the rest under “More related”, and the reader’s top bar has two rows so “Page 1 of 792 · BOOK I” is no longer cut off.',
    'A map pin for a site that names no religion (Mapungubwe, Serpent Mound) now opens a panel for the site. Where a related religion comes only from a book’s shelf, the list says “filed with its texts”.',
    'The data’s own sentences say “the map data” where they said “the Atlas” (four tradition summaries and ten cause notes), and Our promises sends you to Methods and standards, Privacy instead of naming a file in the project.',
  ] },
  { stamp: '2026-11-22-cc0e49', date: '2026-11-22', items: [
    'The 156 claims on the 13 High-control group cards were read against pages that could be opened: 98 were found in the page read, 37 in part, 12 not in the page read, 9 could not be read, and 60 were corrected or narrowed. No card is marked checked.',
    'Each claim on those cards now shows what the reading found (in the page read, in part, not in it, or corrected after reading), and each card says how many of its claims were read. Eleven “Search for it” links now open the court opinion or report itself.',
    'First screens use plain words: a “grade” is now how well sourced a claim is (or how strong the evidence is, for presets), Random’s “Kinds” is Type of text, and “Atlas” is no longer a name: the map is the map.',
    'The zodiac pages say sun-based and star-based, with tropical and sidereal once in brackets so a search for either word still finds them. Motifs open with “recurring stories and images”.',
    'Step by step says who read the causes: written by hand, and 88 of the 179 rows read a second time against their sources by another reader; the others were read by their author only.',
    'All traditions has one quiet Reset filters button under the filters. A Journey view’s way back says By tradition, a station’s Go deeper says Stations for, and the Themes cards are real links you can open in a new tab.',
    'The Random card and the Related strip now follow one rule for which religion a text belongs to, so they cannot disagree.',
  ] },
  { stamp: '2026-11-22-83503e', date: '2026-11-22', items: [
    'A religion’s page can open History filtered to the events that name it or its branches; one chip says so, and its ✕ shows every event again.',
    'A conflict or settlement after 1900 now opens its own Conflicts page from a History address, and History says that its timeline stops at 1900. The empty panel now says “Choose an event”.',
    'The Conflicts page says in plain words that its entries were read by the author only and no specialist has checked them yet.',
    'Event panels, conflict entries, calendar cards, High-control group cards, Journey views, stories, the flood motif, stations and the map panel for a site now end with a Related strip of religions, texts, places and events.',
    'A calendar’s card lists the religions that name it, then those descended from them, and the events of its time.',
    'A religion’s Journey view now links to that religion’s own page (“The full page for Ancient Greek religion”) and the page links back as Stations; the button that opens the map says Open the map.',
    'Each version on a Stories that travel page now links to its text in the reader and to its religion’s page, so none of those pages is a dead end.',
    'A religion’s page now says Dated records and Texts in the catalogue, keeps two map buttons instead of three, and says “No branches recorded” once. The map panel’s two links are Tradition page and Stations.',
    'The Look closer story card now comes last on the map page, Common ground and Motifs, under what each page is about. “Atlas” is no longer a name on these pages: the map is the map.',
  ] },
  { stamp: '2026-11-22-00a208', date: '2026-11-22', items: [
    'A new “Related” strip ends a tradition’s page: events of its time, conflict entries, newer-movement cards and books with pictures that name it. Empty parts are left out, and nothing in it says one religion influenced another.',
    'The reader now names the religion a text is tied to, right under the title, with a link to that religion’s page; the same strip sits in the text’s About tab and at the end of the text.',
    'A text’s strip shows “In its time” only when the text’s own date is known to within a century, and says that date. A picture page now has a Read this book link and the book’s religion.',
    'The reader’s top bar shows one counter, the page, and the name of where you are; section and part numbers moved to the About tab. The Random card’s About this text lists related pages too.',
    'A tradition’s page no longer draws empty “Sites” and “Relationships” cards: one line, the same for every tradition, says what is not recorded for it.',
    'In the search palette a religion’s own page is a Tradition and the Journey’s view of it is a Journey; nothing is called Atlas any more. Library, More, Compare passages is now Parallels and patterns.',
    'Setup has one name (Preferences for its first chip), and its box for telling the maker what to change now sits under the settings. Themes, Intentions and the holy-day calendar end with a link to the next page.',
  ] },
  { stamp: '2026-11-21-8cecf3', date: '2026-11-21', items: [
    'Searching every text from a copy opened from a folder now asks first (it can use several GB of memory) and offers one shelf; the search stops before the browser runs out, keeps what it found, says how far it got and offers each shelf.',
    'The search now says how many of the readable texts it covered (for example 1,442 of the 1,448), counted the same way as Methods and standards.',
    'Common ground’s count, the parallel passages, the readings for a gathering and Wander look at each text and let it go; the count stops, saving nothing, if memory runs short. A lost connection is reported as one.',
    'On a phone, small links and buttons now have a 40 px touch area on the family tree, Step by step, the World chart, High-control groups, the Text catalogue, the Random filters and the Calendars.',
    'The Library page draws a shelf’s cards when the shelf is opened: about 4,300 elements instead of 56,000, so it draws in 13 to 25 ms here instead of 80 to 105 and is lighter on a phone.',
    'Setup, Preferences, has a new Larger text choice (Normal, Larger, Largest) that scales the text of the whole app; Normal looks as before. The bottom bar keeps its small labels so all seven fit.',
  ] },
  { stamp: '2026-11-21-8d5ec3', date: '2026-11-21', items: [
    'Searching every text no longer fills the page’s memory on a website or a served copy: each text is read as data, searched and let go (about 250 MB at most, it was 4.4 GB). A copy opened straight from a folder still loads them all.',
    'On a website, searching every text now says it would download about 1.6 GB and offers one shelf first, and a text over 5 MB says its size and waits for Open anyway.',
    'A note box now has the cursor when it opens, so typing a note no longer presses Save; the same goes for every dialog with a text field. A note on an already highlighted sentence now goes on that highlight.',
    'In the reader, the Aa panel opens on Theme, Size and Easy reading, and A− and A+ change the size by two pixels.',
    'A lost connection is now reported as one (“This could not be loaded. Are you offline?”) on the web; the wording about the folder stays for a copy opened from a file.',
    'The page no longer stops on iPhones before iOS 16.4: the one rule that needed a newer engine was rewritten, and a test guards against more.',
    'Cite names the verse (“Daniel 9:8”, “Daniel 9:7–8”) when the text carries verse numbers; Random’s timing line now says what it counts: one beat for each press or tap.',
    'The app now calls itself an alpha in the header, the welcome and Setup, and feedback is for the person who gave you this copy; the box shows exactly what would be copied, and nothing is sent.',
    'A quiet line on the first page, “New here? Find your way”, opens the newcomer page; the welcome says it works offline once you have saved it (Setup, Take it with you).',
    'High-control groups: each card’s opening line follows one template, and the seven groups not yet written up say what is on the public record or claimed, and by whom, with no verdict in the tool’s own voice.',
    'Conflicts shows in plain sight how far it has been checked; each Library shelf’s paragraph sits under “About this shelf”; Setup folds its sound-level controls; the counts of texts come from one place.',
    'Smaller: the gear says what its dot means, a phone’s tab strip no longer cuts a label, a web copy stops asking for a file it does not have, and a bad address no longer says “There is no such belief”.',
  ] },
  { stamp: '2026-11-21-778b74', date: '2026-11-21', items: [
    'Compare step by step: a second reader checked 54 more of the 179 cause rows against their sources, so 88 have now had a second reading. 21 were corrected, none were removed, and 91 are still marked as first reading only.',
    'Astrology: the Lancet study of birth year, illness and age at death among Chinese-Americans (1993) and Voas’s test of star signs among married couples were added. Each says what was opened; Carlson’s 1985 paper still could not be.',
    'On the map, Nero’s blaming of Christians for the fire of Rome (64 CE) now sits at Rome, not Jerusalem, and the note on the Great Persecution says it lasted until 313 in the east.',
  ] },
  { stamp: '2026-11-21-75b951', date: '2026-11-21', items: [
    'Random has a new Method section: besides chance, a passage can be drawn from a text you type, a date, or dice (rolled for you or typed in from your own). The same text, date or numbers always give the same passage.',
    'A typed text or date is read once to make the seed and is never kept, sent or put in the web address or the card. Each receipt says plainly how the passage was chosen, and that the meaning of the words played no part.',
    'Today lists your daily saved filters beside the other ways. Its receipt now says it is made from today’s date and the filter’s name; it used to say “secure random”, which was wrong.',
  ] },
  { stamp: '2026-11-20-8e29ec', date: '2026-11-20', items: [
    'Cite: a passage, a whole text, a notebook page or a whole notebook can be cited as a Chicago note and bibliography entry, or exported as BibTeX or RIS for Zotero, EndNote and LaTeX. The app itself can be cited too.',
    'A citation names the printed edition the Library hosts and gives a page only where the text has its printed page marks. That you read it in the app is a separate line with the day. A Bible is cited by chapter, and by verse from the Random card.',
    'Nothing in a citation is guessed: what the app cannot read from a text’s edition statement (authors for 981 and years for 1,141 of 1,448 texts can be read) is left out and kept whole in a note.',
  ] },
  { stamp: '2026-11-19-ca891d', date: '2026-11-19', items: [
    'The Notebook can now hold several notebooks: switch between them, make a new one, rename, export or delete one, and move or copy a page from one to another. What you had before is in one called My notebook.',
    'A new page, Setup then Your data, lists each kind of thing the app keeps in this browser with its own button to clear it (most with a short undo). Delete everything now also removes your PDFs and the offline copies.',
  ] },
  { stamp: '2026-11-19-5c85e7', date: '2026-11-19', items: [
    'Random is now its own place, with a dice icon in the menu and the phone bar, and the passage is at the top of its page. Pressing Another no longer scrolls the page back to the top.',
    'Every Random card now says where its passage is from: the religion (a link), the kind of text, its period, the translator and one sentence about the book. A small button draws more from that religion.',
    'Thirty-five texts were added; the Library now holds 1,448. Among them: the Mishna, the Mishcat hadith collection, the Hedaya, the Harivamsha, thirty minor Upanishads and the Siva and Gheranda Samhitas.',
    'Also new: Iqbal’s Secrets of the Self, Averroes and the Senkessar of the Ethiopian Church. Twenty-nine of the new scans have printed page numbers.',
    'A page called Methods and standards (this one): how statements are labelled, how far each part has been read, where the texts come from, what is stored, a log of the readings so far, ready-made citations, and these release notes.',
  ] },
  { stamp: '2026-11-18-c4a3e9', date: '2026-11-18', items: [
    'Random: “Another from this book” is a button again (key B), with a “this book only” choice.',
    'Random mixes the timing of your own key presses, taps and pointer moves into the draw by default again, with its beats beside the Another button.',
    'Random: Short, Medium and Longer passages can be chosen, the six actions on a card are visible again, and the Journey’s 19 traditions are choices.',
  ] },
  { stamp: '2026-11-18-9bd776', date: '2026-11-18', items: [
    'Random: saved filters with names of your own, weighted mixes (for example, mostly one tradition with a little of another) and a daily draw.',
    'Conflicts and peace grew from 55 to 86 entries.',
    'The Hermetic Museum is now a typed copy of the 1893 edition in place of a machine-read scan.',
  ] },
  { stamp: '2026-11-18-ec869e', date: '2026-11-18', items: [
    'One name for one thing across menus, tabs and buttons; touch targets of at least 40 pixels on a phone; dialogs keep the keyboard inside them and return you to where you were.',
    'The History timeline grew from 86 to 293 events, with religion woven in. Conflicts and peace (55 entries) and Calendars and the sky (a day converter, the sun and moon, the zodiac, astrology’s systems) are new.',
    'Random: filters you can combine (religions, periods, books, kinds of text).',
    'The cause rows of Step by step and the outside bodies on High-control groups had a second reading.',
  ] },
  { stamp: '2026-11-18-b37afb', date: '2026-11-18', items: [
    'Random draws by default from scriptures and sources, with a quality check on passages and the modes Passage, One page and Two pages.',
    'The wording of every tradition’s summary follows one frame: what a tradition holds is said as held, and a title is not a status.',
    'The reader: Contents opens on the chapters, search shows results first, a phone reader and a bar for what you select; scanned books open at the text.',
    'Eight first screens (Library, Setup and the welcome dialog, Pictures, the Map, the family tree, the glossary, Step by step) open on content rather than on controls.',
  ] },
  { stamp: '2026-11-18-a0a6d3', date: '2026-11-18', items: [
    'The app reorganised into five places and a gear (Timeline, Traditions, Library, Notebook, Practice, and Setup), opening on the History timeline.',
    'The notebook, a reader with several ways of reading, a voice for guided practices and reading aloud, Random, the first 86 events of the History timeline and the family tree as a branch timeline.',
  ] },
];
if (typeof module !== 'undefined' && module.exports) module.exports = { METH_LOG, METH_STAGES, METH_WHO, METH_EXAMPLES, METH_RELEASES };
