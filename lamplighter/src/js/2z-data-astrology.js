/* ═══════════════════════════ 2z · Astrology’s systems: the data of #/sky/astrology ═══════════════════════════
   The maker (18 November 2026): “i’m not building this to direct opinions. its only a tool for people to form their own opinions.” Six systems that read a date or a birth, each set out the same way, in the same order and at about the same
   length: (a) what the system says, as its practitioners state it; (b) how it is worked out from a date, and what depends on the zodiac chosen; (c) what has been tested and published, with authors, year, venue and what each study
   reported; (d) what practitioners and critics each say about those studies. Nothing here says whether any system works, and no horoscope, personality reading or prediction is made.
   RULES (tests/sky.test.js holds every one):
   · Each statement carries a status: documented (a record or a published work fixes it), reported or claimed (someone says it, or a study reports it, and no record fixes it), disputed (sources or scholars disagree, and the entry says where).
   · Each statement names its sources, and each source has a grade, as in the History timeline: A a record from the time, B a scholarly work or database, C a reference summary. Every source here was opened for this page
     (the `n` note of each says what was read, and where only part was read or only a description, it says so). A study that could not be opened is left out, or named with “not opened”; the report to the project manager lists them.
   · The words are those of the sources, in short quotations, or the project’s own plain words. No word of praise or accusation about any tradition, and a source’s verdict is quoted only with its author named.
   · Where a part has nothing to report (no test, no reply) the entry says so in a `none` note, which is the only thing allowed to stand in for items.
   Date of the reading: 18 November 2026. A second reader (another session) went back to the studies on 21 November 2026, opened what could be opened (the abstract of Phillips, Ruth and Wagner 1993, the citation of Goodkind 1991, two web pages on Voas, the record of McRitchie 2023, a practitioner’s review of Dean and Kelly) and left “not opened” on what could not (Carlson 1985, the paper of Voas, McRitchie 2016, Goodkind’s text). Pages of English Wikipedia are cited for what they print (grade C), and the studies and primary texts they name are cited only where they were opened themselves. */
const SKY_STATUS = {
  documented: { label: 'Documented', text: 'A record or a published work fixes it.' },
  reported: { label: 'Reported or claimed', text: 'Someone says it, or a study reports it, and no record fixes it.' },
  disputed: { label: 'Disputed', text: 'Sources or scholars disagree, and the entry says where.' },
};
/* every source: k the short name, g the grade, t the full citation, url the page that was opened, n what was read */
const SKY_REFS = {
  ptolemy: { k: 'Ptolemy, Tetrabiblos', g: 'A', t: 'Ptolemy, Tetrabiblos, Book I, chapters 1 to 3 and 10 to 20 (about 150 CE), in F. E. Robbins’s translation of 1940 (Loeb Classical Library) as put on LacusCurtius', url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Ptolemy/Tetrabiblos/1A*.html', n: 'read in full' },
  augustine: { k: 'Augustine, Confessions VII', g: 'A', t: 'Augustine of Hippo, Confessions, Book VII, chapter 6 (about 400 CE), in the English translation on New Advent', url: 'https://www.newadvent.org/fathers/110107.htm', n: 'read in full; the page does not name the translator' },
  ertel2009: { k: 'Ertel 2009', g: 'B', t: 'Ertel, S. (2009), “Appraisal of Shawn Carlson’s Renowned Astrology Tests”, Journal of Scientific Exploration 23(2): 125–137', url: 'https://journalofscientificexploration.org/index.php/jse/article/view/99/37', n: 'read in full; it gives Carlson’s design and data and its own reanalysis' },
  carlson1985: { k: 'Carlson 1985', g: 'B', t: 'Carlson, S. (1985), “A double-blind test of astrology”, Nature 318: 419–425', n: 'not opened on 21 November 2026 either: Nature’s page asks for a login, and neither PubMed nor Europe PMC lists the paper; its design and results are taken from Ertel (2009), which tabulates and quotes them' },
  nienhuys1997: { k: 'Nienhuys 1997', g: 'B', t: 'Nienhuys, J. W. (1997), “The Mars Effect in Retrospect”, Skeptical Inquirer 21(6): 24–29 (web copy at skepsis.nl)', url: 'https://skepsis.nl/mars-effect/', n: 'read in full; the author took part in the debate and says so' },
  wp_mars: { k: 'Mars effect (Wikipedia)', g: 'C', t: 'English Wikipedia, “Mars effect”', url: 'https://en.wikipedia.org/wiki/Mars_effect', n: 'read in full' },
  dean_kelly2003: { k: 'Dean and Kelly 2003', g: 'B', t: 'Dean, G. and Kelly, I. W. (2003), “Is astrology relevant to consciousness and psi?”, Journal of Consciousness Studies 10(6–7): 175–198 (the authors’ web copy)', url: 'https://astrology-and-science.com/D-psia1.htm', n: 'only the abstract page was read in full' },
  narlikar: { k: 'Narlikar, An Indian Test', g: 'B', t: 'Narlikar, J. V., “An Indian Test of Indian Astrology” (Thought & Action web copy); the page says a brief account appeared in Current Science 96(5): 641–643 (2009)', url: 'https://thoughtnaction.antisuperstition.org/an-indian-test-of-indian-astrology/', n: 'read in full; written by the organiser of the test' },
  hindupedia: { k: 'Hindupedia, Jyotish', g: 'C', t: 'Hindupedia, “Jyotish” (a Hindu encyclopedia, written in the tradition’s own terms)', url: 'https://hindupedia.com/en/Jyotish', n: 'read in full' },
  wp_nakshatra: { k: 'Nakshatra (Wikipedia)', g: 'C', t: 'English Wikipedia, “Nakshatra”', url: 'https://en.wikipedia.org/wiki/Nakshatra', n: 'the first part (about 40,000 characters, the lead, history and the start of the table) was read in full' },
  wp_ayanamsa: { k: 'Ayanamsa (Wikipedia)', g: 'C', t: 'English Wikipedia, “Ayanamsa”', url: 'https://en.wikipedia.org/wiki/Ayanamsa', n: 'read in full' },
  wp_astrology: { k: 'Astrology (Wikipedia)', g: 'C', t: 'English Wikipedia, “Astrology”', url: 'https://en.wikipedia.org/wiki/Astrology', n: 'the first part (the lead, history, principles and the start of the scientific analysis) was read in full; the later sections were not' },
  wp_sunsign: { k: 'Sun sign astrology (Wikipedia)', g: 'C', t: 'English Wikipedia, “Sun sign astrology”', url: 'https://en.wikipedia.org/wiki/Sun_sign_astrology', n: 'read in full' },
  wp_psych: { k: 'Psychological astrology (Wikipedia)', g: 'C', t: 'English Wikipedia, “Psychological astrology”', url: 'https://en.wikipedia.org/wiki/Psychological_astrology', n: 'read in full' },
  wp_horoscope: { k: 'Horoscope (Wikipedia)', g: 'C', t: 'English Wikipedia, “Horoscope”', url: 'https://en.wikipedia.org/wiki/Horoscope', n: 'read in full apart from its closing references and footer' },
  wp_chinese_zodiac: { k: 'Chinese zodiac (Wikipedia)', g: 'C', t: 'English Wikipedia, “Chinese zodiac”', url: 'https://en.wikipedia.org/wiki/Chinese_zodiac', n: 'the first half (about 80,000 characters) was read in full' },
  wp_four_pillars: { k: 'Four Pillars of Destiny (Wikipedia)', g: 'C', t: 'English Wikipedia, “Four Pillars of Destiny”', url: 'https://en.wikipedia.org/wiki/Four_Pillars_of_Destiny', n: 'read in full' },
  wp_fire_horse: { k: 'Fire Horse (Wikipedia)', g: 'C', t: 'English Wikipedia, “Fire Horse” (hinoe-uma)', url: 'https://en.wikipedia.org/wiki/Hinoeuma', n: 'read in full; it names its sources, among them the Cabinet Office of Japan’s Youth White Paper of 2006 and Kaku 1975' },
  johnson_nye2009: { k: 'Johnson and Nye 2009', g: 'B', t: 'Johnson, N. D. and Nye, J. V. C. (2009), “Does Fortune Favor Dragons?”, Mercatus Center (George Mason University) Working Paper No. 09-27', url: 'https://www.mercatus.org/system/files/Does_Fortune_Favor_Dragons.pdf', n: 'the abstract and the introduction were read; it cites Goodkind (1991), whose citation was checked in Crossref and whose text was not opened' },
  wp_babylonian: { k: 'Babylonian astrology (Wikipedia)', g: 'C', t: 'English Wikipedia, “Babylonian astrology”', url: 'https://en.wikipedia.org/wiki/Babylonian_astrology', n: 'about the first 58 percent was read in full' },
  wp_hellenistic: { k: 'Hellenistic astrology (Wikipedia)', g: 'C', t: 'English Wikipedia, “Hellenistic astrology”', url: 'https://en.wikipedia.org/wiki/Hellenistic_astrology', n: 'read in full' },
  wp_de_div: { k: 'De Divinatione (Wikipedia)', g: 'C', t: 'English Wikipedia, “De Divinatione” (Cicero, 44 BCE)', url: 'https://en.wikipedia.org/wiki/De_Divinatione', n: 'read in full; it says little about astrology' },
  wp_zodiac: { k: 'Zodiac (Wikipedia)', g: 'C', t: 'English Wikipedia, “Zodiac”', url: 'https://en.wikipedia.org/wiki/Zodiac', n: 'read in part; the passage on the Babylonian origin of the twelve signs was read in the page’s own text' },
  wp_sidereal: { k: 'Sidereal and tropical astrology (Wikipedia)', g: 'C', t: 'English Wikipedia, “Sidereal and tropical astrology”', url: 'https://en.wikipedia.org/wiki/Sidereal_and_tropical_astrology', n: 'read in full' },
  wp_tzolkin: { k: 'Tzolk’in (Wikipedia)', g: 'C', t: 'English Wikipedia, “Tzolkʼin”', url: 'https://en.wikipedia.org/wiki/Tzolk%CA%BCin', n: 'read in full' },
  wp_aztec_cal: { k: 'Aztec calendar (Wikipedia)', g: 'C', t: 'English Wikipedia, “Aztec calendar”', url: 'https://en.wikipedia.org/wiki/Aztec_calendar', n: 'read in full' },
  tedlock1982: { k: 'Tedlock 1982', g: 'B', t: 'Tedlock, B. (1982), Time and the Highland Maya, University of New Mexico Press (Albuquerque)', n: 'not opened: named, with a page reference, in the Wikipedia article on the Tzolkʼin' },
  boone2007: { k: 'Boone 2007', g: 'B', t: 'Boone, E. H. (2007), Cycles of Time and Meaning in the Mexican Books of Fate, University of Texas Press', url: 'https://utpress.utexas.edu/9780292712638/cycles-of-time-and-meaning-in-the-mexican-books-of-fate/', n: 'the publisher’s description was read in full; the book itself was not opened' },
  phillips1993: { k: 'Phillips, Ruth and Wagner 1993', g: 'B', t: 'Phillips, D. P., Ruth, T. E. and Wagner, L. M. (1993), “Psychology and survival”, The Lancet 342 (8880): 1142–1145', n: 'the abstract was read in the Europe PMC record (a listing of the database, not a page to browse); the paper itself was not opened. A letter with the same title by Rhoads and others (The Lancet 343: 174, 1994) is named in a list of citations; it was not opened and is not described here' },
  goodkind1991: { k: 'Goodkind 1991', g: 'B', t: 'Goodkind, D. M. (1991), “Creating New Traditions in Modern Chinese Populations: Aiming for Birth in the Year of the Dragon”, Population and Development Review 17(4): 663–686, doi:10.2307/1973601', n: 'not opened: the citation was checked in the Crossref record (title, author, journal, issue, first page, December 1991; the record has no abstract); what it found is taken from Johnson and Nye' },
  voas2007: { k: 'Voas 2007', g: 'B', t: 'Voas, D. (2007), “Ten million marriages: A test of astrological ‘love signs’”, University of Manchester (a Skeptical Inquirer version of 2008 is listed by a secondary source)', n: 'not opened: its title is on the page of the Gauquelin5 project, and its data and finding are taken from the two web pages below; Manchester’s own news page about it no longer exists (HTTP 404)' },
  voas_g5: { k: 'Gauquelin5 page on Voas', g: 'C', t: 'Gauquelin5 project (tig12), the page “2007 - David Voas” on the data of Voas’s study', url: 'https://tig12.github.io/g5/anon-voas.html', n: 'read in full; it gives the data (2001 census, England and Wales; 10,317,649 married couples in its main table) and points to the paper; it does not give the finding' },
  voas_ifl: { k: 'IFLScience on Voas', g: 'C', t: 'Felton, J. (5 August 2021), “A study of 20 million people investigated the truth behind star sign compatibility”, IFLScience', url: 'https://www.iflscience.com/a-study-of-20-million-people-investigated-the-truth-behind-star-sign-compatibility-60561', n: 'read in full; a news article, so a second-hand account of the study; it names no anomaly' },
  currey_dk: { k: 'Currey on Dean and Kelly', g: 'C', t: 'Currey, R., a critical review of Dean and Kelly’s 2003 article, astrology.co.uk (written in 2010 and updated since)', url: 'https://astrology.co.uk/tests/dktests.htm', n: 'read in full; a review by an astrologer, so a practitioner’s view and not a scholarly work' },
  mcritchie2016: { k: 'McRitchie 2016', g: 'B', t: 'McRitchie, K. (2016), “Clearing the Logjam in Astrological Research: Commentary on Geoffrey Dean and Ivan Kelly’s Article ‘Is Astrology Relevant to Consciousness and Psi?’”, Journal of Consciousness Studies 23 (9–10): 153–179', n: 'not opened: the title is as Currey’s page gives it and the volume and pages are from a search result; the publisher’s abstract page, PhilPapers and PhilArchive all refused (HTTP 403)' },
  mcritchie2023: { k: 'McRitchie 2023', g: 'B', t: 'McRitchie, K. (2023), “Defense of Emergent Effects in Astrology Research: Rebuttal of Dean and Kelly (2023)”, Journal of Scientific Exploration 37 (3): 576–579 (correspondence)', url: 'https://journalofscientificexploration.org/index.php/jse/article/view/3121', n: 'the page was read: it gives the title, author, volume, pages and date (19 October 2023) and no abstract; the text itself was not opened' },
  site: { k: 'Computed on this site', g: 'B', t: 'Worked out on this site by the formulas of Meeus, Astronomical Algorithms (1998), chapters 25, 27 and 49, and the Calendrical Calculations of Reingold and Dershowitz, checked against published equinox times and the Hong Kong Observatory’s tables (tests/sky.test.js)', n: 'a computation, not a reading' },
};
/* the six systems. says (a), works (b), tested (c), replies (d: practitioners and critics). An item is { s: status, t: text, src: [ids] }; a tested item is { name, who, year, venue, did, found, s, src }; a note is { none: text }. */
const SKY_SYSTEMS = [
  { id: 'western', name: 'Western astrology', short: 'Western', zodiac: 'Sun-based (tropical)',
    blurb: 'The tradition that grew from Hellenistic astrology and is now practised in Europe and the Americas, in a traditional form that reads signs and events and a psychological form that reads the chart as a symbolic map. It uses the tropical zodiac.',
    glance: { looks: 'The Sun, Moon and planets', cycle: 'Twelve tropical signs of 30°, twelve houses, angles between planets (aspects)', needs: 'The date (a Sun sign); the time and place as well (a full chart)', sky: 'Yes: the Sun, Moon and planets' },
    says: [
      { s: 'reported', t: 'Practitioners hold that the positions of the Sun, Moon and planets, read through the twelve signs, the twelve houses and the angles between planets, say something about a person and a life. Two planets 120° apart (a trine) are read as in a harmonious relationship and two 90° apart (a square) as in a conflicted one.', src: ['wp_astrology'] },
      { s: 'documented', t: 'The founding text is Ptolemy’s Tetrabiblos (about 150 CE). It names two ways of prediction from the stars: knowing “the aspects of the movements of sun, moon, and stars”, and investigating “the changes which they bring about”. It says the second “can go no further than what happens in the ambient and the consequences to man from such causes”.', src: ['ptolemy'] },
      { s: 'reported', t: 'Psychological astrology, begun by Dane Rudhyar (The Astrology of Personality, 1936) and carried on by Liz Greene and others (the Centre for Psychological Astrology, London, 1983), reads the horoscope through the archetypes of depth psychology. Carl Jung is quoted as writing that astrology “represents the sum of all the psychological knowledge of antiquity”.', src: ['wp_psych'] },
      { s: 'documented', t: 'Sun-sign astrology gives each person one of twelve signs by the date of birth. Sun-sign horoscopes began to appear in English newspapers in the 1930s, and R. H. Naylor had a regular column, Your Stars, in the Sunday Express by 1937. The reference article notes that the Sun sign is only one twelfth of a full chart.', src: ['wp_sunsign', 'wp_astrology'] },
    ],
    works: [
      { s: 'documented', t: 'The zodiac is the tropical zodiac: twelve signs of 30°, counted from the March equinox, which is 0° Aries. Ptolemy: “the sign which begins with the vernal equinox, that of Aries, is the starting-point of them all.”', src: ['wp_astrology', 'ptolemy'] },
      { s: 'documented', t: 'A Sun sign needs only the date: it is the sign the Sun is in, by its tropical longitude. The dates are approximate (the Sun enters Aries on about 20 or 21 March) and “may differ from one year to another (by a day or so)”; the exact moment needs an ephemeris. Where was the sun? gives it for any day.', src: ['wp_sunsign', 'site'] },
      { s: 'documented', t: 'A full chart needs the exact time and place of birth, to find the Ascendant (the point of the ecliptic rising on the eastern horizon) and the twelve houses: “it is essential to know the latitude of the event.” The planets’ positions come from an ephemeris.', src: ['wp_horoscope'] },
      { s: 'documented', t: 'What depends on the zodiac chosen: by the Lahiri sidereal zodiac, which is 24.2° from the tropical one in 2024, the Sun is in a different sign from its tropical sign on about four days in five, and in the same sign only while it is in the last 5.8° of a tropical sign. Tropical astrologers take the signs from the seasons, sidereal astrologers from the stars.', src: ['site', 'wp_sidereal'] },
    ],
    tested: [
      { name: 'A double-blind test of natal charts', who: 'Shawn Carlson', year: 1985, venue: 'Nature 318: 419–425', s: 'reported', src: ['ertel2009', 'carlson1985'],
        did: 'Fewer than 28 astrologers were asked to match 116 birth charts with personality profiles from the California Psychological Inventory, choosing among three profiles for each chart (the owner’s and two others added at random). Two further studies asked students to pick, among descriptions or profiles, the one that was theirs.',
        found: 'Carlson reported that the astrologers did not choose the owner’s profile at better than chance: the first choice was right in 40 of 116 cases (.345) against .333 expected. He concluded: “We are now in a position to argue a surprisingly strong case against natal astrology as practiced by reputable astrologers.”' },
      { name: 'A reanalysis of Carlson’s tests', who: 'Suitbert Ertel', year: 2009, venue: 'Journal of Scientific Exploration 23(2): 125–137', s: 'disputed', src: ['ertel2009'],
        did: 'Ertel analysed Carlson’s first study again, counting first and second choices together, as Carlson had said he would, and the astrologers’ ratings of how well each profile fitted.',
        found: 'The astrologers were right 86 times in 116 against 77.3 expected (binomial Z = 1.61, p = .054), and their fit ratings rose with correctness (tau = .088, p = .04). Ertel calls this “insufficient to deem astrology as empirically verified” but “sufficient to regard Carlson’s negative verdict on astrology as untenable”.' },
      { name: 'The Mars effect', who: 'Michel Gauquelin (1955), the Comité Para (1967), Kurtz, Zelen and Abell (1979), the CFEPP (Benski and others, 1996)', year: 1996, venue: 'as reported by Nienhuys, Skeptical Inquirer 21(6) (1997)', s: 'disputed', src: ['nienhuys1997', 'wp_mars'],
        did: 'Tests of Gauquelin’s report that sports champions were born more often when Mars had just risen or crossed the meridian (“key sectors”).',
        found: 'Gauquelin: “rather more like 22 percent” of champions against about 17 percent expected. Comité Para: 119 of 535 champions (22.24 percent). The American test: 55 of 408 (13.48 percent). The French test: 209 of 1,120 (18.66 percent), against a base rate that Nienhuys puts at 17.70 percent. Each side reads these differently (see below).' },
      { name: 'People born minutes apart', who: 'Geoffrey Dean and Ivan W. Kelly', year: 2003, venue: 'Journal of Consciousness Studies 10(6–7): 175–198', s: 'reported', src: ['dean_kelly2003'],
        did: 'A large-scale test of persons born less than five minutes apart, who on the astrological account should resemble each other.',
        found: 'The abstract says it “found no hint of the similarities predicted by astrology”.' },
      { name: 'Sun signs of ten million married couples', who: 'David Voas', year: 2007, venue: 'a University of Manchester paper, as two web pages describe it', s: 'reported', src: ['voas2007', 'voas_g5', 'voas_ifl'],
        did: 'He took the Sun signs of husband and wife for about ten million married couples in the 2001 census of England and Wales (10,317,649 in the main table of one page; a news article says “all 20 million birthdays of married couples”), in what that article calls a statistical analysis of star-sign compatibility.',
        found: 'The article reports that there was no evidence that people married someone of a particular Sun sign: the numbers were “just what we’d predict on the basis of chance”, Voas is quoted as saying. It names no anomaly, and the paper itself was not opened.' },
    ],
    replies: {
      practitioners: [
        { s: 'reported', t: 'The astrologer Teresa Hamilton, who advised on Carlson’s design, said later: “Carlson followed none of my suggestions. I was never satisfied that the experiment was a fair test of astrology” (Hamilton 1986, quoted by Ertel).', src: ['ertel2009'] },
        { s: 'disputed', t: 'Ertel (University of Göttingen) argues that Carlson’s design “violated the demands of fairness”, that choosing among three is a poorer test than comparing two, and that too few people took part to show small effects, of the size Gauquelin found (.03 to .07). He cites Eysenck (1986), who called the inventory’s scales “arbitrary and subjective”.', src: ['ertel2009'] },
        { s: 'reported', t: 'On the Mars effect, Gauquelin and Gauquelin answered the American test in 1979 (“Star U.S. Sportsmen Display the Mars Effect”, Skeptical Inquirer 4(2)), and Ertel (1992) faulted the French test for including too many mediocre athletes and for too high a chance expectation.', src: ['wp_mars'] },
        { s: 'reported', t: 'Kenneth McRitchie answered Dean and Kelly’s article in the Journal of Consciousness Studies in 2016 and again in the Journal of Scientific Exploration in 2023 (“Defense of Emergent Effects in Astrology Research”); neither text was opened. The astrologer Robert Currey’s review says the 2016 commentary “refuted” the article and was “a comprehensive response”, and that the article’s test of people born minutes apart is unpublished.', src: ['currey_dk', 'mcritchie2016', 'mcritchie2023'] },
      ],
      critics: [
        { s: 'reported', t: 'Nienhuys (1997) defends the French protocol and argues that Gauquelin’s apparent result came from bias in his choice of champions; the French committee concluded the same (Benski and others, 1996).', src: ['nienhuys1997', 'wp_mars'] },
        { s: 'reported', t: 'The reference article states: “Scientific testing of astrology has been conducted, and no evidence has been found to support any of the premises or purported effects outlined in astrological traditions.” It names no study for that sentence.', src: ['wp_astrology'] },
        { s: 'reported', t: 'The same article reports that Kuhn described “attempts by astrologers to explain away failures by saying that creating a horoscope is very difficult”.', src: ['wp_astrology'] },
      ],
    } },

  { id: 'hindu', name: 'Hindu astrology (Jyotisha)', short: 'Hindu (Jyotisha)', zodiac: 'Star-based (sidereal)',
    blurb: 'The traditional Indian system, rooted in the Vedic and Puranic tradition and counted as a Vedanga, an auxiliary of the Veda. It uses the sidereal zodiac and the 27 lunar nakshatras.',
    glance: { looks: 'The Moon, Sun and planets (the grahas)', cycle: 'Twelve sidereal signs (rashis) of 30° and 27 nakshatras of 13° 20′', needs: 'The date (the Sun’s sign); the time and place as well (a full chart)', sky: 'Yes: the Moon above all' },
    says: [
      { s: 'reported', t: 'Hindupedia, a Hindu reference site, calls Jyotisha “the traditional Indian system of astrology rooted in Vedic-Purānic tradition” and “a Vedānga or an auxiliary text to the Veda”.', src: ['hindupedia'] },
      { s: 'reported', t: 'It states that Jyotisha gives the rules for the timing of the fruition of past actions (karma), that its predictions “are reflections of karma phalas”, and that it “provides the tangible proofs in favour of existence of soul and rebirth”.', src: ['hindupedia'] },
      { s: 'reported', t: 'It has two branches: Ganita (Siddhānta), the calculation, and Phalita (Samhitā and Horā), the reading, which includes Jātaka (birth charts) and Prashna (questions asked). The almanac (Panchānga) has five parts: tithi, karana, rāsi, nakshatra and vāra.', src: ['hindupedia'] },
      { s: 'reported', t: 'The texts it names include the Vedānga Jyotiṣa of Lagadha, the Brihat Pārāshara Horā Shāstra, the Jaimini Sutra and the Suryasiddhānta, which states that it was given by the Sun-god. The page gives no date in the common era for the Vedānga Jyotiṣa.', src: ['hindupedia'] },
    ],
    works: [
      { s: 'documented', t: 'The zodiac is sidereal (nirayana): the year begins at “nirayana (sidereal) Mesha”, and the moon sign (rāsi) and the nakshatra “depend solely on Moon’s absolute motion with respect to Fixed Sky”. The offset from the tropical zodiac is the ayanamsa; the Lahiri value, “by far the most prevalent system in India”, is 24.2° in 2024.', src: ['hindupedia', 'wp_ayanamsa', 'site'] },
      { s: 'documented', t: 'The Moon’s sidereal longitude gives its nakshatra: there are 27 (sometimes 28) sectors along the ecliptic, “each nakshatra spans 13° 20′”, in four quarters (padas) of 3° 20′, from Ashvini to Revati.', src: ['wp_nakshatra'] },
      { s: 'documented', t: 'As in other horoscopic systems a full chart is cast for the time and place of birth; the Sun’s sidereal sign alone needs only the date. Where was the sun? gives the Sun’s sign by the Lahiri and the Fagan–Bradley zero for any day; this site does not work out the Moon’s nakshatra.', src: ['wp_horoscope', 'site'] },
      { s: 'documented', t: 'What depends on the zodiac chosen: everything here is counted from the sidereal zero. The same Sun gives a different sign from the tropical one on about four days in five (see the Western entry), and a person’s moon sign and nakshatra move with the ayanamsa chosen.', src: ['site'] },
    ],
    tested: [
      { name: 'A test of Indian astrologers', who: 'Jayant Narlikar, Sudhakar Kunte, Narendra Dabholkar and Prakash Ghatpande', year: 2009, venue: 'announced at Pune on 12 May 2008; a brief account in Current Science 96(5): 641–643', s: 'reported', src: ['narlikar'],
        did: 'Fifty-one astrologers asked for horoscopes and twenty-seven sent back judgments. Each was given 40 charts, drawn from 100 “mentally bright” teenagers rated by their teachers and 100 mentally handicapped people from special schools, and asked which was which. Birth data came from parents, and a former professional astrologer calculated the charts.',
        found: 'Chance gives 20 right of 40. The 27 averaged 17.25 and the best had 24; a team that judged all 200 charts was right 102 times. The rules of the president of the Maharashtra Astrological Society scored 47 percent for sex and 50 percent for intelligence, against the 60 percent he claimed. The organisers concluded: “our results are firmly against Indian astrology being considered as a science.”' },
      { none: 'No other published test of Jyotisha was opened for this page. The tests listed under Western astrology used the tropical zodiac, not the sidereal one.' },
    ],
    replies: {
      practitioners: [
        { s: 'reported', t: 'The Pune and Maharashtra astrological societies were concerned that “the data had been collected by skeptics” and tried to dissuade others from taking part; the Maharashtra society “had urged astrologers to boycott” the test (Narlikar’s account).', src: ['narlikar'] },
        { s: 'reported', t: 'At a seminar an organiser offered the testers “a set of ten rules”; of about a dozen astrological organisations contacted, two showed interest and one sent in its judgment (Narlikar’s account).', src: ['narlikar'] },
      ],
      critics: [
        { s: 'reported', t: 'Narlikar and his co-organisers read the results as against Indian astrology being considered a science, and the account says the charts were coded and kept by the statistician Kunte until the judgments were in.', src: ['narlikar'] },
        { none: 'No other published criticism of Jyotisha was opened for this page.' },
      ],
    } },

  { id: 'chinese', name: 'Chinese astrology', short: 'Chinese', zodiac: 'None (the lunar year)',
    blurb: 'Two related practices: the twelve animals and five elements taken from the Chinese lunar year, and the Four Pillars of Destiny (BaZi), which reads the stems and branches of the year, month, day and hour of birth. Neither uses a zodiac of signs.',
    glance: { looks: 'The lunar year (animal, element); in the Four Pillars the year, month, day and hour', cycle: 'Twelve animals; ten stems and twelve branches making a cycle of sixty', needs: 'The date (the lunar year); the hour as well (the Four Pillars)', sky: 'Through the calendar: the Sun and Moon' },
    says: [
      { s: 'reported', t: 'The zodiac is the twelve animals in order: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig. It is “believed to influence people’s personalities, careers, compatibility, marriages, and fortunes”, and practitioners offer “putative guidance in life or for love and marriage”.', src: ['wp_chinese_zodiac'] },
      { s: 'reported', t: 'Compatibility rests on the Five Elements theory, “believed to be the common law of motions and changes of creatures in the universe”, and on a grid of trines, harmonies, clashes, harms and punishments between the animals.', src: ['wp_chinese_zodiac'] },
      { s: 'reported', t: 'The Four Pillars of Destiny is “historically used to analyse an individual’s destiny, fate or life path based on the person’s date and time of birth”. Practitioners “may recommend adjustments to one’s environment, behaviour, or timing of major decisions”, and it is often practised alongside feng shui.', src: ['wp_four_pillars'] },
      { s: 'reported', t: 'The article dates the roots to stem-and-branch counting of days under the Shang (about 1600 to 1046 BCE), three pillars to Li Xuzhong (Tang, about 761 to 813) and four to Xu Ziping (Song, 960 to 1279). It says the practice was suppressed in the People’s Republic (Bruun 2003, as cited).', src: ['wp_four_pillars'] },
    ],
    works: [
      { s: 'documented', t: 'The animal comes from the Chinese lunar year, twelve animals in turn, with the ten Heavenly Stems giving the five elements and yin and yang in a cycle of sixty years. “For the starting date of a zodiac year, there are two schools of thought in Chinese astrology: Chinese New Year or the start of spring.”', src: ['wp_chinese_zodiac'] },
      { s: 'documented', t: 'So the date decides, and the school: a person born on 9 February 2024 is in the Rabbit’s lunar year (the Dragon’s began on 10 February), but in the Dragon’s year by the start of spring, which falls on about 4 February. Any day gives the Chinese date of any day.', src: ['wp_chinese_zodiac', 'site'] },
      { s: 'documented', t: 'The Four Pillars pair a stem with a branch for the year, month, day and hour. “The month is determined by the solar terms … rather than the lunar month”, and the hour is one of twelve double-hours, so the system needs the hour of birth as well as the date.', src: ['wp_four_pillars'] },
      { s: 'documented', t: 'What depends on the zodiac chosen: nothing, as there is no zodiac of signs. The solar terms are marked by the Sun’s ecliptic longitude in steps of 15° from the March equinox, and the months by the new Moon; this site works both out for the Chinese date in Any day.', src: ['site'] },
    ],
    tested: [
      { name: 'Do Dragon-year children do better?', who: 'Noel D. Johnson and John V. C. Nye', year: 2009, venue: 'Mercatus Center Working Paper No. 09-27', s: 'reported', src: ['johnson_nye2009'],
        did: 'They tested the belief that children born in the Year of the Dragon are superior, with United States Current Population Survey data on Asian immigrants born in the Dragon year 1976 and on the general population.',
        found: 'Asian immigrants born in 1976 were more educated than comparable immigrants from other years; no such effect appeared among Dragon-year children in the general population. Asian mothers of Dragon-year babies were more educated, richer and slightly older. The authors read this as the belief being “self-fulfilling”.' },
      { name: 'Births in Dragon years', who: 'Daniel M. Goodkind (1991, “Creating New Traditions in Modern Chinese Populations: Aiming for Birth in the Year of the Dragon”, Population and Development Review 17(4): 663–686), as reported by Johnson and Nye', year: 1991, venue: 'reported in Mercatus Working Paper No. 09-27', s: 'reported', src: ['johnson_nye2009', 'goodkind1991'],
        did: 'Counts of births in Chinese populations in Dragon years.',
        found: 'A “sizeable boost in births” in Taiwan, Hong Kong and Singapore, though not in mainland China, in the Dragon years 1976 and 1988; in Taiwan 15.5 percent more births in 1976 than in 1975.' },
      { name: 'The Fire Horse year in Japan', who: 'Japan’s vital statistics (Cabinet Office, Youth White Paper, 2006) and Kaku (1975, Annals of Human Biology)', year: 1966, venue: 'as reported by the Wikipedia article “Fire Horse”', s: 'documented', src: ['wp_fire_horse'],
        did: 'Counts of births in 1966, the hinoe-uma (Fire Horse) year of the same sixty-year cycle, which popular belief held ill-fated for women born in it.',
        found: 'Births in Japan in 1966 fell 25 percent from the year before, to 1,360,974; in 1906 they fell about 4 percent. The article attributes the fall to the belief and cites Kaku (1975), “Increased induced abortion rate in 1966”.' },
      { name: 'Birth year, illness and age at death', who: 'D. P. Phillips, T. E. Ruth and L. M. Wagner', year: 1993, venue: 'The Lancet 342 (8880): 1142–1145', s: 'reported', src: ['phillips1993'],
        did: 'They compared the deaths of 28,169 adult Chinese-Americans with those of 412,632 matched controls coded “white” on the death certificate, asking whether a combination of birth year and disease that Chinese astrology and medicine consider ill-fated went with an earlier death.',
        found: 'The abstract says that Chinese-Americans, but not whites, died 1.3 to 4.9 years earlier when they had such a combination, that the more strongly a group kept Chinese traditions the more years were lost, and that the effect held for nearly all major causes of death. It says the effect was not fully explained by changed behaviour of the patient, the doctor or the registrar, and at least partly reflected psychosomatic processes.' },
      { none: 'The first three studies look at a belief about one animal year and at what people did because of it; the Lancet study looks at an old pairing of a birth year with an illness. No published test of the Four Pillars, or of the animals’ readings of character, was opened for this page.' },
    ],
    replies: {
      practitioners: [
        { s: 'reported', t: 'The belief itself, as the paper states it: many East Asians, especially ethnic Chinese, have long believed that children born in the Year of the Dragon “are especially fortunate, are likely to do well in school, and generally have a better life”.', src: ['johnson_nye2009'] },
        { none: 'No reply by Chinese astrologers to these studies was found in the sources read.' },
      ],
      critics: [
        { s: 'reported', t: 'In 1987 governments warned against having babies in Dragon years because of the strain on schools; editorials “claimed no special luck or intelligence for Dragon babies”, and a programme in Taiwan alerted parents to the problems of an unusually large cohort (Goodkind 1991, p. 677, as cited).', src: ['johnson_nye2009', 'goodkind1991'] },
        { s: 'reported', t: 'Johnson and Nye read their own result as the belief being self-fulfilling: the parents who can time a birth are the ones who invest more in their children, which they say explains the immigrant result.', src: ['johnson_nye2009'] },
        { s: 'reported', t: 'The Four Pillars practice was suppressed in the People’s Republic (Bruun 2003, as cited in the reference article).', src: ['wp_four_pillars'] },
      ],
    } },

  { id: 'hellenistic', name: 'Hellenistic and Babylonian roots', short: 'Hellenistic and Babylonian', zodiac: 'Sun-based (tropical) for the Hellenistic, star-based (sidereal) for the Babylonian',
    blurb: 'The roots, as history: the celestial omens of Mesopotamia and the horoscopic astrology that Greek-writing astrologers developed in Egypt and around the Mediterranean from about 100 BCE. Its best-known text is Ptolemy’s Tetrabiblos.',
    glance: { looks: 'The planets, the Sun, the Moon and the signs; for the Babylonians, omens for the king and state', cycle: 'Twelve equal signs of 30° (Babylonian about 400 BCE); the Hellenistic signs counted from the equinoxes and solstices', needs: 'The date, time and place of birth for a horoscope', sky: 'Yes: the planets above all' },
    says: [
      { s: 'reported', t: 'Scholarly celestial divination in Babylon is “generally reported to begin with late Old Babylonian texts (c. 1800 BC)”. The omen series Enūma Anu Enlil has 70 cuneiform tablets of 7,000 celestial omens. Early Babylonian astrology was “solely mundane”: it concerned “the king as the governing head of the nation” and “the welfare of the state”.', src: ['wp_babylonian'] },
      { s: 'reported', t: 'Hellenistic astrology “developed and practiced in the late Hellenistic period in and around the Mediterranean Basin region, especially in Egypt”, began “sometime around the late 2nd or early 1st century BCE” and was practised until the 6th or 7th century CE. Ptolemy’s Tetrabiblos “laid the basis of the Western astrological tradition”.', src: ['wp_hellenistic'] },
      { s: 'documented', t: 'Ptolemy (about 150 CE) writes that one way of prediction apprehends “the aspects of the movements of sun, moon, and stars” and the other investigates “the changes which they bring about”, and that it “can go no further than what happens in the ambient and the consequences to man from such causes”.', src: ['ptolemy'] },
      { s: 'documented', t: 'Ptolemy calls the art conjectural: “every science that deals with the quality of its subject-matter is conjectural and not to be absolutely affirmed”, and says “predictions sometimes fail”.', src: ['ptolemy'] },
    ],
    works: [
      { s: 'documented', t: 'Babylonian astronomers divided the ecliptic into twelve equal signs of 30° around the end of the fifth century BCE, between about 409 and 398 BCE, and fixed them to stars: Cancer at β Geminorum, Aquarius at δ Capricorni.', src: ['wp_zodiac'] },
      { s: 'documented', t: 'Ptolemy counts the signs from the equinoxes and solstices: “the sign which begins with the vernal equinox, that of Aries, is the starting-point of them all”, and “the first interval of 30° from the summer solstice, the sign of Cancer”.', src: ['ptolemy'] },
      { s: 'documented', t: 'What depends on the zodiac chosen is here at its root: a Hellenistic position from a date is the Sun’s tropical longitude, a Babylonian one is fixed to the stars, and the two zodiacs “were aligned around 2,000 years ago” and have drifted apart by precession (see The zodiac).', src: ['wp_sidereal', 'site'] },
      { s: 'documented', t: 'A horoscope also needs the time and place of birth to find the Ascendant (see the Western entry). This site gives the Sun’s place on any day (Where was the sun?) and does not cast charts or read the other planets.', src: ['wp_horoscope', 'site'] },
    ],
    tested: [
      { name: 'Firminius and the slave', who: 'Augustine of Hippo', year: 400, venue: 'Confessions, Book VII, chapter 6 (about 400 CE)', s: 'reported', src: ['augustine'],
        did: 'He reports a case he was told: the son of a friend of his father’s, Firminius, and a slave born to a servant of the same household at the same moment, so that “neither of them could discern any difference either in the position of the stars or other most minute points”.',
        found: 'Firminius “ran his course through the prosperous paths of this world”; the slave “continued to serve his masters”. Augustine concludes that whatever an astrologer foretold truly was “not by art, but by chance”. It is the same kind of comparison as the study of people born minutes apart, listed under Western astrology.' },
      { name: 'Modern studies of the history', who: 'Barton (1994), Neugebauer and Van Hoesen (1959), Koch-Westenholz (1995)', year: '1959 to 1995', venue: 'Ancient Astrology; Greek Horoscopes; Mesopotamian Astrology', s: 'documented', src: ['wp_hellenistic', 'wp_babylonian'],
        did: 'Scholarly studies of the surviving texts and horoscopes, named in the two reference articles.',
        found: 'Their findings were not read for this page, and none is reported here.' },
      { none: 'No modern controlled test of Hellenistic or Babylonian practice itself was found; the tests listed under Western astrology are of the modern practice.' },
    ],
    replies: {
      practitioners: [
        { s: 'documented', t: 'Ptolemy answers those who point to its errors: “we do not discredit the art of the pilot for its many errors.”', src: ['ptolemy'] },
        { s: 'documented', t: 'He says that criticism of the science “on the score of impossibility has been specious but undeserved”, and that those who find fault with the uselessness of prognostication “have no regard for the most important matters”.', src: ['ptolemy'] },
      ],
      critics: [
        { s: 'documented', t: 'Augustine (about 400 CE) argues from twins: if an astrologer foretold the same of Esau and Jacob, “the same did not happen to them”, and so “he must therefore speak falsely”; if he spoke truly it was “not then by art, but by chance”.', src: ['augustine'] },
        { s: 'reported', t: 'In Book II of De Divinatione (44 BCE) Cicero gives, from his Academic sceptic standpoint, arguments against auguries, auspices, astrology, lots and dreams. The reference article gives no detail of the passage on astrology.', src: ['wp_de_div'] },
        { s: 'reported', t: 'The modern editor’s note in the Loeb text says: “The Academic school, led by Carneades, initiated the most serious attack against it in antiquity.” (a note of the editor, not Ptolemy’s words)', src: ['ptolemy'] },
      ],
    } },

  { id: 'maya', name: 'Maya Tzolk’in', short: 'Maya Tzolk’in', zodiac: 'None (a count of days)',
    blurb: 'The 260-day count of the Maya, twenty day names with thirteen numbers, still used by day-keepers in the Guatemalan highlands. It is a count of days, not a zodiac.',
    glance: { looks: 'A day count: 20 day names against 13 numbers, 260 days', cycle: 'No zodiac; the pair of name and number returns after 260 days', needs: 'The date alone (with a chosen correlation)', sky: 'No: a count of days' },
    says: [
      { s: 'documented', t: 'The Tzolk’in “combines a cycle of twenty named days with another cycle of thirteen numbers (the trecena)”, which makes 260 days. It was “extensively used in Mayan inscriptions and codices”.', src: ['wp_tzolkin'] },
      { s: 'reported', t: 'Today it “is still used by several Maya communities in the Guatemalan highlands”, where “the 260 days are employed in training the Aj K’ij, or ‘calendar diviner’”. The K’iche’ term the article gives is Aj Ilabal Q’ij, “the sense of the day”, which it marks as needing a source.', src: ['wp_tzolkin'] },
      { s: 'reported', t: 'Uses the article lists: naming, “traditional Mayan names, which are based on calendar days”; choosing days, as “a low-numbered Ak’ab’al or B’en would be a good day for a wedding”; and divination by “counting forward through the calendar from the current ‘year bearer’ to arrive at a day which is then interpreted”, which it says “is not pure cleromancy”.', src: ['wp_tzolkin'] },
      { s: 'reported', t: 'Barbara Tedlock studied the system in the K’iche’ community of Momostenango, “underwent a formal apprenticeship in calendar divination with a local adept, and was initiated as a diviner in 1976”. The article cites her for the statement that “there is no fixed first day”.', src: ['wp_tzolkin', 'tedlock1982'] },
    ],
    works: [
      { s: 'documented', t: 'The day name and number advance by one each day: names go round twenty, numbers 1 to 13, so the same pair returns after 260 days. This site works out the Tzolk’in of any day (Any day) with the Goodman–Martínez–Thompson correlation, the usual choice (day 584,283): for example 20 March 2024 is 3 Manik’.', src: ['wp_tzolkin', 'site'] },
      { s: 'documented', t: 'It uses no zodiac and does not depend on the Sun, Moon or stars: it is a count of days. What depends on the choice is the correlation, which ties a Tzolk’in day to a day of our calendars.', src: ['wp_tzolkin', 'site'] },
      { s: 'disputed', t: 'Why 260? The reference article lists the product of 13 and 20 (Thompson 1950), the length of human pregnancy, and the Sun’s zenith passages at a Mesoamerican latitude (Malmström 1973), of which it says “others object to this conception”.', src: ['wp_tzolkin'] },
      { s: 'documented', t: 'Together with the 365-day Haab’ the pair of dates returns after 18,980 days, which is 52 years; Any day shows both.', src: ['site'] },
    ],
    tested: [
      { name: 'An ethnography of the day-keepers', who: 'Barbara Tedlock', year: 1982, venue: 'Time and the Highland Maya, University of New Mexico Press', s: 'reported', src: ['wp_tzolkin', 'tedlock1982'],
        did: 'A study of K’iche’ day-keepers at Momostenango that rests on her apprenticeship in divination; named in the reference article, and the book was not opened for this page.',
        found: 'It is cited for the statement that the count has no fixed first day (pp. 174 to 177).' },
      { none: 'No test of the Tzolk’in’s predictions was found in the sources read.' },
    ],
    replies: {
      practitioners: [
        { none: 'No reply by day-keepers to any test was found in the sources read.' },
      ],
      critics: [
        { none: 'No published criticism of the count’s divination was found in the sources read. Scholars do disagree about the origin of the 260 days (above).' },
      ],
    } },

  { id: 'aztec', name: 'Aztec Tonalpohualli', short: 'Aztec Tonalpohualli', zodiac: 'None (a count of days)',
    blurb: 'The 260-day count of the Mexica, twenty day signs with thirteen numbers, kept in painted divinatory books. It is a count of days, not a zodiac.',
    glance: { looks: 'A day count: 20 day signs against 13 numbers, 260 days', cycle: 'No zodiac; twenty periods of 13 days (trecenas), each with its deity', needs: 'The date alone (with a correlation that is disputed)', sky: 'No: a count of days' },
    says: [
      { s: 'documented', t: 'The tonalpohualli is “a cycle of 260 days, each day signified by a combination of a number from 1 to 13” and one of twenty day signs. The 260 days are grouped into twenty periods of 13 (trecenas), each “named according to the calendar date of the first day” and with its own tutelary deity. The day signs are the same as the Mixtecs’.', src: ['wp_aztec_cal'] },
      { s: 'reported', t: 'Elizabeth Hill Boone (2007) writes that the divinatory almanacs of the painted books served “to predict the fate of newborns, to guide people in choosing marriage partners and auspicious wedding dates”, with other almanacs on “birth, marriage, agriculture and rain, travel, and the forces of the planet Venus”.', src: ['boone2007'] },
      { s: 'reported', t: 'The article gives the Nahuatl term in cencalli tonalli in its account of the trecena and credits it to Book IV of Sahagún’s Florentine Codex.', src: ['wp_aztec_cal'] },
      { s: 'disputed', t: 'Boone argues that the surviving codices “grew out of a single religious and divinatory system”. Her publisher names two points of controversy: whether the Codex Borgia’s great narrative is “a cosmic narrative of creation”, which she argues it is, and “the disputed origins of the codices”.', src: ['boone2007'] },
    ],
    works: [
      { s: 'documented', t: '“With each new day, both the number and day sign would be incremented”, so the same pair returns after 260 days. With the 365-day year of the Mexica the pair returns after 52 years, which the year converter shows as the year bearer.', src: ['wp_aztec_cal', 'site'] },
      { s: 'disputed', t: 'Matching a day sign to a European date needs a correlation, and proposals differ. Rafael Tena (2008), “based on the studies of Sahagún and Alfonso Caso”, puts the first day of the Mexica year at 13 February in the Julian calendar, 23 February in the Gregorian; Ruben Ochoa, using the vernal equinox, and José Medina Ramos, building on Ochoa and Tena, propose others, which the article says “go against strong evidence pointed out by scholars”. This site does not work out Tonalpohualli dates.', src: ['wp_aztec_cal'] },
      { s: 'documented', t: 'It uses no zodiac and does not depend on the Sun, Moon or stars: it is a count of days. The article read says nothing about how a day was read for a person; Boone’s description (above) is the source here for its use.', src: ['wp_aztec_cal', 'boone2007'] },
    ],
    tested: [
      { name: 'A study of the painted books', who: 'Elizabeth Hill Boone', year: 2007, venue: 'Cycles of Time and Meaning in the Mexican Books of Fate, University of Texas Press', s: 'reported', src: ['boone2007'],
        did: 'A study of the divinatory almanacs of the painted books; the publisher’s description was read, and the book was not opened.',
        found: 'It explains the “graphic vocabulary of the calendar and its prophetic forces” and “the organizing principles that structure the codices”; two areas of controversy are named (above).' },
      { none: 'No test of the tonalpohualli’s predictions was found in the sources read.' },
    ],
    replies: {
      practitioners: [
        { s: 'reported', t: 'The article says that some Mexican groups, such as Kaltonak, are proposing another reconstruction of the calendar.', src: ['wp_aztec_cal'] },
        { none: 'No reply by present-day readers of the count to any test was found in the sources read.' },
      ],
      critics: [
        { s: 'reported', t: 'Scholars the article cites hold that two of the proposed correlations “go against strong evidence” about when the Mexica day began and the lack of a leap day in all Mesoamerican calendars (above).', src: ['wp_aztec_cal'] },
        { none: 'No criticism of the count as a method of divination was found in the sources read.' },
      ],
    } },
];
const SKY_SYSTEM_BY_ID = Object.fromEntries(SKY_SYSTEMS.map((x) => [x.id, x]));
if (typeof module !== 'undefined' && module.exports) module.exports = { SKY_STATUS, SKY_REFS, SKY_SYSTEMS, SKY_SYSTEM_BY_ID };
