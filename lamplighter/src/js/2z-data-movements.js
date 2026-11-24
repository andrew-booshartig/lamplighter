/* ═══════════════════════════ 2z · High-control groups and contested movements ═══════════════════════════
   The newer religious movements are the Atlas's biggest hole: their scriptures are post-1930 and in copyright, so the Library cannot hold them. This page covers them the honest way: what each
   movement says about itself, what independent sources document (each claim with a source and a grade), the legal outcomes with dates, the group's reply, the harm that is documented stated
   plainly, its texts (and where they can be read, which is almost nowhere here), and where to look further. It never reproduces a movement's scripture or recruiting material.
   Language: "cult" is never used as a verdict. A movement can meet some of the yardsticks (MOV_TERM) and not others; the cards say what the record shows, not what to conclude.
   Above the cards sits a box for the reader (MOV_ASK, 18 November 2026): ten questions to ask any group, in our own words, and where to turn if you are worried about someone (MOV_HELP, each body labelled with its point of view).
   The rule for a claim about a living person: a court record, an official report, or at least two independent reputable sources; otherwise it says "alleged" and by whom.
   Review state: every entry carries `review` (see MOV_REVIEW). 'unchecked' means that not every claim has been read and found against its source; the page says so on every card and prints how far the reading (the first reading and its second part, both 22 November 2026, MOV_READ; every claim has now been read, two are still not in the page read) got, in one form for the whole page and for each card.
   claim: { t, g (a MOV_GRADES key), s [source ids], by? (who alleges it: required for 'alleged'), r? (the reading: ok, part, nf; none = not read), fx? (1 = corrected after reading) }; harm claims also carry type (a MOV_HARM key); a legal item also carries d (date) and where.
   source: { kind (a MOV_SRC_KINDS key), cite (author, title, publisher, year: the words of the citation), url (https), link ('direct' = the page itself; 'search' = a search at a library, court or encyclopedia that finds it) } */
const movOl = (q) => 'https://openlibrary.org/search?q=' + encodeURIComponent(q);
const movDdg = (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent(q);
const movCl = (q) => 'https://www.courtlistener.com/?q=' + encodeURIComponent(q);

/* what a claim rests on, never how bad it is */
const MOV_GRADES = {
  record: ['Court or official record', 'A court judgment, verdict or plea, or the report of an official inquiry. The strongest kind of source here, though a court decides what is proved, not everything that is true.'],
  reported: ['Independent reporting', 'Two or more independent, reputable sources agree: investigative journalism, scholarly books or peer-reviewed articles.'],
  testimony: ['Former members’ accounts', 'First-hand accounts by people who left. Real evidence, ranked lower because each account is one side and few can be checked; shown with who says it.'],
  alleged: ['Alleged', 'Said by a named party and not established in a court or an official inquiry. The card says who says it.'],
  own: ['The group’s own statement', 'What the group says about itself or in reply. Shown as its claim, not tested.'],
};
/* how a source is kinded: what it is, which decides what it can support */
const MOV_SRC_KINDS = {
  court: ['Court record', 'A judgment, verdict, plea or sentence'],
  gov: ['Official report', 'A government inquiry, commission or record'],
  press: ['Journalism', 'An investigative report in a newspaper, magazine or book by a reporter'],
  scholar: ['Scholarship', 'A university-press book or a peer-reviewed article'],
  testimony: ['Former member’s account', 'A first-hand account by someone who left the group'],
  own: ['The group’s own words', 'A site or publication of the group itself'],
  org: ['Research and support organisation', 'A body that studies or supports people affected; neither a court nor a journal'],
};
/* the kinds of documented harm (the filter on the page) */
const MOV_HARM = { deaths: 'Deaths', violence: 'Violence', sexual: 'Sexual abuse or exploitation', children: 'Harm to children', financial: 'Financial exploitation or fraud', family: 'Family separation', labour: 'Unpaid or forced labour', health: 'Health and medical neglect' };
/* where each stands now */
const MOV_STATUS = { active: ['Active', 'The movement exists today'], changed: ['Changed or split', 'It continues under another form, or has split'], ended: ['Ended', 'The movement ended'] };
/* the overall picture: how settled the record is, not how severe */
const MOV_OVERALL = { courts: ['In court and official records', 'Much of what is said below rests on court judgments or official inquiries'], reported: ['Reporting and scholarship', 'Mostly journalism and scholarship; little has been tested in court'], contested: ['Contested', 'The label itself is disputed; scholars and courts disagree, or the evidence of harm is mixed or thin'] };
/* the review state of an entry */
const MOV_REVIEW = { unchecked: ['Under review', 'Every claim names its source. The claims were read against sources on 22 November 2026, and the line below says what the reading found on this card; a claim with no mark has not yet been read. Check a claim against its source before relying on it.'], checked: ['Checked', 'Each claim and date was re-read against its source'] };
/* The first reading against sources (22 November 2026, FACT_CHECK.md): a claim that has been read carries `r`: 'ok' = everything it says was found in a source that was opened; 'part' = some of it was found and some not; 'nf' = the sources read did not say it (kept as written, and labelled). A claim with no `r` has not been read. `fx: 1` = its text was corrected or narrowed to what the source says. A card is marked 'checked' only when every one of its claims is 'ok'.
   The words of the marks (FINAL_AUDIT.md FA-01, 22 November 2026): each tag says what the reading did, in the same words for every group, and never reads as a verdict: a claim that was not in the page read is not thereby wrong, and the page's key line says so. Each mark is [the tag, its tooltip, its line in the key under the page-level count]; the internal keys ok / part / nf / fx stay. */
const MOV_READ = { date: '22 November 2026', marks: {
  ok: ['Found in the page read', 'Read against a page that was opened on 22 November 2026: everything this claim says was in it.', 'the page we read says it.'],
  part: ['Part of it in the page read', 'Read against a page that was opened on 22 November 2026: part of this claim was in it and part was not. That does not make the rest wrong; the text is kept as written so you can check it.', 'the page says part of it, and the rest stays as written.'],
  nf: ['Not in the page read', 'The page that was opened on 22 November 2026 did not say this. That does not make it wrong: the text is kept as written so you can check it against its own source.', 'the page does not say it. That does not make it wrong: the text stays as written, so you can check it.'] },
  fx: ['Corrected after reading', 'Our text was corrected or narrowed to match what the source says.', 'we changed our text to match the page.'] };

const MOV_TERM = {
  title: 'High-control groups and contested movements',
  line: 'Some religious and self-improvement groups ask a great deal of their members: money, time, family ties, silence. Former members, researchers, courts and officials have questioned some of these demands, and in a few groups members died, as court records and official inquiries document. This page records them as documented history, with each claim labelled by what it rests on, and the group’s own view beside it.',
  why: [
    'The word “cult” is not used here as a verdict. In religious studies it has an old, neutral sense, the worship or veneration of a saint, a hero or a god, and in everyday speech it has become an accusation; in some countries, such as China, a similar word is a legal label for banning a group. None of these tells you what a group did. Scholars of new religions generally say “new religious movement” for the first and, for what this page is about, describe what a group does.',
    'The term used instead is “high-control group”: a group that, by pressure or force, gets sustained control over its members’ lives (money, time, sex, relationships, information) and makes leaving or doubting costly. A movement can meet some of the yardsticks below and not others, can differ between its decades, its branches and its people, and can be strict by consent without being harmful: monasteries, many strict communities and demanding congregations ask a great deal of their members and are not high-control groups in this sense. The questions that matter are what happens to a person who doubts or leaves, and whether the leaders answer to anyone outside.',
    'A card is a record of what sources document, not a ruling on a believer. Members, ex-members and the families of the dead are real people, and a group’s harms are not every member’s doing. Where a claim is only alleged, the card says so and says by whom. Nothing is stated about a living person that a court record, an official report or at least two independent, reputable sources do not support.',
  ],
  yardsticks: [
    { id: 'lifton', name: 'Robert Jay Lifton, eight themes of “ideological totalism” (1961)', src: 'lifton1961', note: 'From his study of thought reform in China and Chinese prisons; later applied by others to new movements. A way of describing a milieu, not a test with a score.',
      items: ['Milieu control: the group controls what members see, read and say to one another.', 'Mystical manipulation: events staged or read as signs of a higher purpose.', 'The demand for purity: the world is split into the pure and the impure.', 'The “cult of confession”: private faults confessed for the group’s use.', 'The sacred science: the doctrine is beyond question and also “scientific”.', 'Loading the language: stock phrases that end thought.', 'Doctrine over person: a person’s own experience is made to fit the doctrine.', 'The dispensing of existence: the group decides who has a right to belong, and outsiders are lesser.'] },
    { id: 'icsa', name: 'The International Cultic Studies Association’s checklist (after Michael Langone)', src: 'icsa', note: 'A checklist of fifteen characteristics that the ICSA (an organisation that offers education and support to survivors, families and professionals) associates with high-control groups. It was first presented in the 1990s by Michael Langone and has been revised since; the current version was published in 2015. Paraphrased here; read the ICSA’s own wording. The ICSA says that it is “not so much a diagnostic instrument as it is an analytical tool” and not a definitive checklist, so it is a list of things to look for, not a diagnosis.',
      items: ['A leader, or a few leaders, to whom members show unquestioning commitment.', 'Questions, doubt and dissent are discouraged or punished.', 'Practices that dull critical thinking (long chanting, denunciation sessions, exhausting routines) used heavily.', 'Leaders tell members, often in minute detail, what to think, do and feel.', 'The group claims a special, exalted status for itself and its leader.', 'A polarised “us against them” view that puts the group in conflict with the wider society.', 'Leaders who answer to no outside authority.', 'The group’s goals are said to justify means that members would once have called wrong.', 'Guilt or shame used to control members.', 'Members cut ties with family and friends and give up earlier goals and interests.', 'Preoccupation with bringing in new members.', 'Preoccupation with raising money.', 'Members expected to give very large amounts of time.', 'Members expected to live and socialise only with one another.', 'The most committed members come to feel that there is no life outside the group.'] },
    { id: 'lalich', name: 'Janja Lalich, “bounded choice” (2004)', src: 'lalich2004', note: 'A sociologist who studied Heaven’s Gate and a political group, arguing that commitment grows from four things working together.',
      items: ['Charismatic authority: a leader believed to have special gifts or a unique mission.', 'A transcendent belief system: a total account of the world and of the group’s place in it.', 'Systems of control: rules, roles and punishments that organise the group.', 'Systems of influence: the social pressures and rewards that make members want to stay.'] },
  ],
  caution: [
    'These are lenses, not scores. No scholar adds a group up out of ten, and the same yardstick fits a monastery, a movement for social change and a coercive group alike, so what matters is the documented record on each card.',
    'Scholars of new religions have long warned that the accusation can do harm of its own. Eileen Barker’s study of the Unification Church (1984) found that most people who tried its workshops did not join and that most who joined left; Bromley and Shupe (1981) argued that the “cult scare” of the 1970s turned a moral panic into a policy; and the way Waco was handled shows what can follow when officials treat a religion as only a danger. Others, among them survivors, family members and clinicians, have documented real and lasting harm. Both are true of different groups, and sometimes of the same one.',
  ],
};

/* Outside help for someone worried about a person in a group (BACKLOG D9, 18 November 2026), each labelled with its point of view. Only bodies that are known to exist are named; an address is given only where it is
   the body’s own site, and for any other the page says to search for the name. None is a neutral referee, and the page says so. Second reading, 18 November 2026 (FACT_CHECK.md): five of the six sites were opened and each
   line was checked against the body’s own pages; the ICSA’s old address (icsahome.com) now only announces its move to internationalculticstudies.org, so that is the address; MIVILUDES’ own site could not be opened, so it keeps no link. */
const MOV_HELP = [
  { id: 'icsa', name: 'International Cultic Studies Association (ICSA)', url: 'https://www.internationalculticstudies.org/', view: 'Support and research for people affected', line: 'A United States organisation that began in 1979 as the American Family Foundation. It says it provides education, support and collaboration for survivors, families and professionals, and it publishes a peer-reviewed journal and holds an annual conference. It says it is not an activist or advocacy group. Its site carries the checklist paraphrased above.' },
  { id: 'inform', name: 'INFORM (Information Network Focus on Religious Movements)', url: 'https://www.inform.ac/', view: 'Academic information service', line: 'An independent educational charity founded in 1988 at the London School of Economics by the sociologist Eileen Barker, and now based at King’s College London. It says it provides information about “minority religions and sects” that is as accurate, up-to-date and evidence-based as possible, and that it exists to prevent harm that comes from misinformation about them.' },
  { id: 'cesnur', name: 'CESNUR (Center for Studies on New Religions)', url: 'https://www.cesnur.org/', view: 'Scholarly centre on new religions', line: 'A non-profit centre for the academic study of new religious movements, founded in Italy in 1988 by a group of scholars and based in Turin. It publishes a journal and books and holds an annual conference. Its own papers say that each group should be examined on its own merits, and it opposes special laws against “cults”; critics, among them some other scholars and journalists, say it is too friendly to the groups it studies and can understate harm.' },
  { id: 'hassan', name: 'Freedom of Mind Resource Center', url: 'https://freedomofmind.com/', view: 'Former member and counsellor', line: 'The centre of Steven Hassan, a former member of the Unification Church whom its site describes as a licensed mental health professional in the United States. His site says he developed the BITE model (behaviour, information, thought and emotional control), one of the sources of the questions above. Some scholars dispute the term “mind control” and parts of his model.' },
  { id: 'recovering', name: 'Recovering from Religion', url: 'https://www.recoveringfromreligion.org/', view: 'Peer support for people leaving a religion', line: 'A secular United States non-profit that offers peer conversations, online support groups and a directory of therapists to people who are questioning, leaving or recovering from religion. It is not about high-control groups in particular, and it says it is not against anyone’s faith and will not try to talk anyone out of belief.' },
  { id: 'miviludes', name: 'MIVILUDES (France)', url: '', view: 'Government body', line: 'The French government’s inter-ministerial mission on “dérives sectaires” (sectarian aberrations), created by decree on 28 November 2002 and attached to the Ministry of the Interior. Its decree speaks of groups of a sectarian character whose practices harm human rights, threaten public order or break the law. How the state uses that label is disputed by some scholars and religious groups. Search for its name; no link is given here.' },
];
/* Questions to ask any group (BACKLOG D9, 18 November 2026): a tool for the reader, never a verdict on a group. In our own words, drawn from Lifton’s themes of thought reform, Singer’s six conditions, Hassan’s BITE model,
   the ICSA checklist (after Langone) and the scholars of new religious movements (Barker, Bromley and Shupe, Lalich); none of their wording is copied. Every question has to fit a congregation, a political party,
   a company, a therapy practice, a club or a gym alike, so none mentions a belief, a god or a religion. tests/movements.test.js keeps these rules. */
const MOV_ASK = {
  title: 'Questions to ask any group before you join or give time or money',
  intro: [
    'These ten questions work for any group: a congregation, a political party, a company, a therapy practice, a club or a gym. They are a tool for you, not a verdict on any group listed on this page or anywhere else.',
    'Almost every group asks something of its members. Being strict, demanding or unusual is not the same as being harmful: many monasteries, teams and professions ask a great deal, openly and by consent. These questions look at consent, openness and the freedom to say no and to leave, not at what a group believes. Answer from what you have seen yourself, not from what the group says about itself. A single “yes” settles nothing, and a pattern matters more than any one answer.',
  ],
  questions: [
    { q: 'Were you told the whole of it from the start?', look: 'Did you learn what the group teaches, what it will ask of you, what it costs and who runs it before you committed, or do these come out in stages, once you are invested?' },
    { q: 'Are you free to take your time?', look: 'Can you think it over, sleep on it and talk to people outside, or are you hurried by deadlines, special offers, “now or never”, or warnings about what you will lose by waiting?' },
    { q: 'Can you ask hard questions and get straight answers?', look: 'Are doubts and disagreement welcome, or are they explained away by the group’s own teaching, treated as disloyalty, or taken as proof that you are not ready?' },
    { q: 'Can you leave, and what happens if you do?', look: 'Can a person step back or go without being shamed, shunned, threatened, followed or made to pay, and do they keep their friends, family, belongings and good name?' },
    { q: 'What does it ask of your money, time and attention?', look: 'Does it want more than you can comfortably give, tie giving to belonging or progress, draw on your savings or debts, or keep its accounts closed? Can you see where the money goes?' },
    { q: 'Who does it want you to spend your time with?', look: 'Are you steered away from old friends, family, study, work or interests, toward living and socialising mostly inside the group?' },
    { q: 'How does it speak about people outside it?', look: 'Are outsiders, including doubters and people who left, described as enemies, lost or lesser? Is your contact with them, or what you may read and hear, restricted or watched?' },
    { q: 'How far does it reach into your private life?', look: 'Does it direct your body, sleep, food, sex, medical care, clothes, work or whom you may marry, in ways you did not freely choose and could not refuse?' },
    { q: 'What feelings does it rely on?', look: 'Does it use guilt, shame, fear, or warmth that is withdrawn when you disagree, or ask you to confess private faults that the group then uses?' },
    { q: 'Who answers to whom?', look: 'Is there a person whose word may not be questioned, or are there leaders who answer to nobody outside the group (a board, an auditor, a regulator, a court, a wider body) and whose decisions and accounts nobody else may examine?' },
  ],
  after: 'Then look outside the group. Read what courts, regulators, journalists and researchers have said, and what people who left and people who stayed say, without the group choosing whom you meet. Tell someone you trust who is not in the group what you have been asked to do, give or accept, and listen to how it sounds to them.',
  from: 'The questions are in our own words. They draw on the published work below: Robert Jay Lifton’s themes of thought reform (1961), Margaret Singer’s six conditions of thought reform (1995), Steven Hassan’s BITE model of behaviour, information, thought and emotional control, the checklist of the International Cultic Studies Association (after Michael Langone), and the studies by scholars of new religious movements such as Eileen Barker, who stress consent, openness and the freedom to leave and warn against judging a group by its label. Read the originals for their own wording.',
  sources: ['lifton1961', 'singer1995', 'hassan1988', 'icsa', 'barker1984', 'lalich2004'],
  worried: {
    title: 'If you are worried about someone',
    points: [
      'Stay in touch and keep the relationship warm. INFORM and pages on the ICSA’s site both advise listening and asking open questions rather than arguing about the group’s teaching, and not telling the person that they are wrong, foolish or deceived; INFORM also warns against trying to remove anyone by force.',
      'Get information from more than one place before you act (the ICSA advises gathering it from various sources) and, where money, children, health or the law are involved, from a doctor, a lawyer or a counsellor who is not part of the group. The last part is our own suggestion, not either body’s.',
      'If someone is in immediate danger, or a child is being harmed, contact your local emergency number or child-protection service.',
    ],
    helpIntro: 'Outside help comes from different points of view. None of these is a neutral referee, so read more than one.',
    help: MOV_HELP,
    note: 'The Lamplighter Project sends nothing about you or this page to any of them: a link opens in a new tab only when you click it, and tells the other site nothing about where you came from. The five addresses were opened on 18 November 2026 and each description was checked against the body’s own pages; the French body’s own site could not be opened, so its line rests on public accounts of its decree. Sites change: if one does not open, search for the name.',
  },
};

const MOV_SOURCES = {
  /* the yardsticks and the scholarship on the word */
  lifton1961: { kind: 'scholar', cite: 'Robert Jay Lifton, Thought Reform and the Psychology of Totalism: A Study of “Brainwashing” in China (W. W. Norton, 1961), chapter 22', url: movOl('Lifton Thought Reform and the Psychology of Totalism'), link: 'search' },
  icsa: { kind: 'org', cite: 'International Cultic Studies Association (ICSA), “Characteristics associated with cultic groups”, a checklist of fifteen characteristics first presented by Michael Langone in the 1990s and revised since (the current version was published in ICSA Today, 6(3), 2015)', url: 'https://internationalculticstudies.org/icsa-classics/characteristics-associated-with-cultic-groups/', link: 'direct' },
  lalich2004: { kind: 'scholar', cite: 'Janja Lalich, Bounded Choice: True Believers and Charismatic Cults (University of California Press, 2004)', url: movOl('Lalich Bounded Choice True Believers and Charismatic Cults'), link: 'search' },
  barker1984: { kind: 'scholar', cite: 'Eileen Barker, The Making of a Moonie: Choice or Brainwashing? (Basil Blackwell, 1984)', url: movOl('Barker The Making of a Moonie Choice or Brainwashing'), link: 'search' },
  bromley1981: { kind: 'scholar', cite: 'David G. Bromley and Anson D. Shupe Jr., Strange Gods: The Great American Cult Scare (Beacon Press, 1981)', url: movOl('Bromley Shupe Strange Gods The Great American Cult Scare'), link: 'search' },
  melton: { kind: 'scholar', cite: 'J. Gordon Melton (ed.), Encyclopedia of American Religions (Gale; many editions)', url: movOl('Melton Encyclopedia of American Religions'), link: 'search' },
  singer1995: { kind: 'scholar', cite: 'Margaret Thaler Singer, with Janja Lalich, Cults in Our Midst: The Hidden Menace in Our Everyday Lives (Jossey-Bass, San Francisco, 1995), chapter 3, where her six conditions of thought reform are set out', url: movOl('Singer Lalich Cults in Our Midst'), link: 'search' },
  hassan1988: { kind: 'testimony', cite: 'Steven Hassan, Combatting Cult Mind Control (Park Street Press, Rochester, Vermont, 1988; later editions are spelled Combating), by a former member of the Unification Church, whose later editions present the BITE model (behaviour, information, thought and emotional control)', url: movOl('Hassan Combatting Cult Mind Control'), link: 'search' },
  /* Scientology */
  scn_org: { kind: 'own', cite: 'Church of Scientology International, the Church’s own site (what Scientology is, its beliefs and its programmes)', url: 'https://www.scientology.org/', link: 'direct' },
  scn_news2015: { kind: 'own', cite: 'Church of Scientology International, letter to ABC News of 27 October 2015 on questions about a former member, as published on the Church’s newsroom site: its statements on “fair game” and on former members who speak against it', url: 'https://www.scientologynews.org/statements/abc-news/church-of-scientology-letter-on-mike-rinder-questions.html', link: 'direct' },
  scn_hbo2015: { kind: 'own', cite: 'The Church of Scientology’s lawyer, letter of 19 March 2015 to the lawyers of HBO about the film Going Clear, as published on the Church’s Going Clear response site (Freedom magazine): its account of its treatment by governments, the press and former members', url: 'https://www.freedommag.org/going-clear/letters/to-stephanie-abrutyn/march-19-lieberman-film-by-alex-gibney.html', link: 'direct' },
  urban2011: { kind: 'scholar', cite: 'Hugh B. Urban, The Church of Scientology: A History of a New Religion (Princeton University Press, 2011)', url: movOl('Urban The Church of Scientology A History of a New Religion'), link: 'search' },
  lewis2009: { kind: 'scholar', cite: 'James R. Lewis (ed.), Scientology (Oxford University Press, 2009)', url: movOl('Lewis Scientology Oxford University Press 2009'), link: 'search' },
  wright2013: { kind: 'press', cite: 'Lawrence Wright, Going Clear: Scientology, Hollywood, and the Prison of Belief (Alfred A. Knopf, 2013)', url: movOl('Wright Going Clear Scientology Hollywood and the Prison of Belief'), link: 'search' },
  hill2013: { kind: 'testimony', cite: 'Jenna Miscavige Hill (with Lisa Pulitzer), Beyond Belief: My Secret Life Inside Scientology and My Harrowing Escape (William Morrow, 2013)', url: movOl('Jenna Miscavige Hill Beyond Belief'), link: 'search' },
  heldt1981: { kind: 'court', cite: 'United States v. Heldt, 668 F.2d 1238 (D.C. Cir. 1981), the appeal of the Operation Snow White convictions', url: 'https://static.case.law/f2d/668/cases/1238-01.json', link: 'direct' },
  newfaith1983: { kind: 'court', cite: 'Church of the New Faith v. Commissioner of Pay-roll Tax (Victoria) (1983) 154 CLR 120, High Court of Australia', url: movDdg('"Church of the New Faith" Commissioner of Pay-roll Tax 154 CLR 120'), link: 'search' },
  hodkin2013: { kind: 'court', cite: 'R (on the application of Hodkin) v. Registrar General of Births, Deaths and Marriages [2013] UKSC 77, United Kingdom Supreme Court, 11 December 2013', url: 'https://caselaw.nationalarchives.gov.uk/uksc/2013/77/press-summary', link: 'direct' },
  paris2009: { kind: 'court', cite: 'Tribunal correctionnel de Paris, judgment of 27 October 2009 (Celebrity Centre and the Scientology bookshop; organised fraud); appeal decided 2012', url: movDdg('Tribunal correctionnel Paris 27 octobre 2009 scientologie escroquerie en bande organisée Celebrity Centre'), link: 'search' },
  foster1971: { kind: 'gov', cite: 'Sir John Foster, Enquiry into the Practice and Effects of Scientology: Report (HMSO, Cmnd. 4964, 1971)', url: 'https://www.cs.cmu.edu/~dst/Cowen/audit/fosthome.html', link: 'direct' },
  anderson1965: { kind: 'gov', cite: 'K. V. Anderson, Report of the Board of Inquiry into Scientology (Government of Victoria, Australia, 1965)', url: 'https://www.cs.cmu.edu/~dst/Cowen/audit/andrhome.html', link: 'direct' },
  mcpherson: { kind: 'court', cite: 'State of Florida v. Church of Scientology Flag Service Organization, Sixth Judicial Circuit, Pinellas County (charges filed November 1998 and dropped June 2000, after the death of Lisa McPherson in 1995)', url: movDdg('State of Florida v. Church of Scientology Flag Service Organization Lisa McPherson charges dropped June 2000'), link: 'search' },
  hansard1980: { kind: 'gov', cite: 'House of Commons, written answer by the Home Secretary, 16 July 1980 (Hansard, vol. 988, c. 578W), lifting the ban on foreign Scientologists; the Lords’ debate of 8 August 1980 gives the scope of the 1968 ban', url: 'https://api.parliament.uk/historic-hansard/written-answers/1980/jul/16/scientology', link: 'direct' },
  petitjuriste: { kind: 'press', cite: 'Le Petit Juriste, “Condamnation de l’Église de la scientologie : patience et longueur de temps…”, a legal commentary on the Paris judgment of 27 October 2009, the appeal decision of 2 February 2012 and the decision of the Court of Cassation of 16 October 2013 (Cass. crim., nos. 03-83.910, 05-82.121, 12-81.532)', url: 'https://www.lepetitjuriste.fr/condamnation-de-leglise-de-la-scientologie-patience-et-longueur-de-temps/', link: 'direct' },
  armstrong1984: { kind: 'court', cite: 'Church of Scientology of California v. Gerald Armstrong, Los Angeles Superior Court, No. C 420153, Memorandum of Intended Decision of June 1984, signed by Judge Paul G. Breckenridge Jr. (the document as held in the Internet Archive’s collection of the Armstrong case papers; it was read in the archive’s plain-text copy)', url: 'https://archive.org/download/armstrong.1.documents.by.date/1984-06-22%20Memorandum%20Of%20Intended%20Decision.pdf', link: 'direct' },
  armstrong1991: { kind: 'court', cite: 'Church of Scientology of California v. Armstrong, 232 Cal.App.3d 1060 (Cal. Ct. App., 29 July 1991), the appeal of the trial court’s judgment of 10 August 1984 (judgment affirmed)', url: 'https://static.case.law/cal-app-3d/232/cases/1060-01.json', link: 'direct' },
  /* Peoples Temple */
  jonestown918: { kind: 'scholar', cite: 'Jonestown Institute, San Diego State University, “How many people died on November 18?” (909 at Jonestown, five at Port Kaituma, four in Georgetown: 918) and “How many children and minors died in Jonestown?” (304 under eighteen)', url: 'https://jonestown.sdsu.edu/?p=35368', link: 'direct' },
  jonestown: { kind: 'scholar', cite: 'Alternative Considerations of Jonestown and Peoples Temple, the Jonestown Institute, San Diego State University (a scholarly archive of documents, recordings and survivors’ accounts)', url: 'https://jonestown.sdsu.edu/', link: 'direct' },
  house1979: { kind: 'gov', cite: 'U.S. House of Representatives, Committee on Foreign Affairs, The Assassination of Representative Leo J. Ryan and the Jonestown, Guyana Tragedy: Report of a Staff Investigative Group (U.S. Government Printing Office, 15 May 1979)', url: 'https://jonestown.sdsu.edu/?p=13662', link: 'direct' },
  moore2009: { kind: 'scholar', cite: 'Rebecca Moore, Understanding Jonestown and Peoples Temple (Praeger, 2009)', url: movOl('Rebecca Moore Understanding Jonestown and Peoples Temple'), link: 'search' },
  chidester1988: { kind: 'scholar', cite: 'David Chidester, Salvation and Suicide: An Interpretation of Jim Jones, the Peoples Temple, and Jonestown (Indiana University Press, 1988)', url: movOl('Chidester Salvation and Suicide Jim Jones Peoples Temple Jonestown'), link: 'search' },
  reiterman1982: { kind: 'press', cite: 'Tim Reiterman with John Jacobs, Raven: The Untold Story of the Rev. Jim Jones and His People (E. P. Dutton, 1982)', url: movOl('Reiterman Raven The Untold Story of the Rev. Jim Jones and His People'), link: 'search' },
  kilduff1977: { kind: 'press', cite: 'Marshall Kilduff and Phil Tracy, “Inside Peoples Temple”, New West, 1 August 1977', url: movDdg('Kilduff Tracy "Inside Peoples Temple" New West August 1977'), link: 'search' },
  layton1988: { kind: 'court', cite: 'United States v. Layton, 855 F.2d 1388 (9th Cir. 1988), the appeal of Larry Layton’s 1986 conviction', url: 'https://static.case.law/f2d/855/cases/1388-01.json', link: 'direct' },
  /* Heaven's Gate */
  deseret1997a: { kind: 'press', cite: 'Deseret News, 29 March 1997, “A trail of grief as families mourn cultists” (with Los Angeles Times reporting): the findings of the San Diego County medical examiner so far, the ages and numbers of the dead and the castrations', url: 'https://www.deseret.com/1997/3/29/19303221/a-trail-of-grief-as-families-mourn-cultists/', link: 'direct' },
  deseret1997b: { kind: 'press', cite: 'Deseret News, 5 April 1997, “Tests show wide range of drugs in cultists’ bodies” (Associated Press): the toxicology report of the San Diego County medical examiner', url: 'https://www.deseret.com/1997/4/5/19304825/tests-show-wide-range-of-drugs-in-cultists-bodies', link: 'direct' },
  zeller2014: { kind: 'scholar', cite: 'Benjamin E. Zeller, Heaven’s Gate: America’s UFO Religion (New York University Press, 2014)', url: movOl('Zeller Heaven\'s Gate America\'s UFO Religion'), link: 'search' },
  balch2002: { kind: 'scholar', cite: 'Robert W. Balch and David Taylor, “Making Sense of the Heaven’s Gate Suicides”, in David G. Bromley and J. Gordon Melton (eds.), Cults, Religion, and Violence (Cambridge University Press, 2002)', url: movOl('Bromley Melton Cults Religion and Violence Cambridge'), link: 'search' },
  deseret1997c: { kind: 'press', cite: 'Deseret News, 12 April 1997, “Cult leader suffered from heart disease” (Associated Press): the San Diego County medical examiner’s autopsy results on the 39 deaths, given on 11 April 1997', url: 'https://www.deseret.com/1997/4/12/19306148/cult-leader-suffered-from-heart-disease/', link: 'direct' },
  sdme1997: { kind: 'gov', cite: 'San Diego County Medical Examiner, findings on the 39 deaths at Rancho Santa Fe, California, March 1997 (as reported in the press at the time)', url: movDdg('Heaven\'s Gate 1997 San Diego County medical examiner phenobarbital 39 deaths Rancho Santa Fe'), link: 'search' },
  hg_site: { kind: 'own', cite: 'The Heaven’s Gate web site, kept online by former members (the group’s own writings and videos, including its statement on the word suicide)', url: 'https://www.heavensgate.com/', link: 'direct' },
  /* Aum Shinrikyo */
  reader2000: { kind: 'scholar', cite: 'Ian Reader, Religious Violence in Contemporary Japan: The Case of Aum Shinrikyo (University of Hawai‘i Press, 2000)', url: movOl('Ian Reader Religious Violence in Contemporary Japan Aum Shinrikyo'), link: 'search' },
  lifton1999: { kind: 'scholar', cite: 'Robert Jay Lifton, Destroying the World to Save It: Aum Shinrikyo, Apocalyptic Violence, and the New Global Terrorism (Metropolitan Books, 1999)', url: movOl('Lifton Destroying the World to Save It Aum Shinrikyo'), link: 'search' },
  senate1995: { kind: 'gov', cite: 'U.S. Senate, Permanent Subcommittee on Investigations, Global Proliferation of Weapons of Mass Destruction: A Case Study on the Aum Shinrikyo (staff statement, 31 October 1995)', url: 'https://irp.fas.org/congress/1995_rpt/aum/index.html', link: 'direct' },
  tokyo2004: { kind: 'court', cite: 'Tokyo District Court, judgment of 27 February 2004 sentencing Shoko Asahara to death; the Supreme Court of Japan made it final in September 2006', url: movDdg('Asahara death sentence Tokyo District Court 27 February 2004 Supreme Court September 2006'), link: 'search' },
  nhk2018: { kind: 'press', cite: 'News reports (NHK, Kyodo, Reuters, The Japan Times) of the executions of Shoko Asahara and six others on 6 July 2018 and of six more on 26 July 2018', url: movDdg('Asahara executed 6 July 2018 Aum Shinrikyo six more executed 26 July 2018'), link: 'search' },
  psia: { kind: 'gov', cite: 'Public Security Intelligence Agency (Japan), its public account of Aum Shinrikyo and its successor groups, and the 1999 Act on the Control of Organizations which Committed Indiscriminate Mass Murder', url: movDdg('Public Security Intelligence Agency Japan Aum Shinrikyo Aleph Hikari no Wa surveillance Act on the Control of Organizations which Committed Indiscriminate Mass Murder'), link: 'search' },
  /* Branch Davidians */
  treasury1993: { kind: 'gov', cite: 'U.S. Department of the Treasury, Report of the Department of the Treasury on the Bureau of Alcohol, Tobacco and Firearms Investigation of Vernon Wayne Howell also known as David Koresh (September 1993)', url: movDdg('Treasury report 1993 Bureau of Alcohol Tobacco and Firearms Investigation of Vernon Wayne Howell also known as David Koresh'), link: 'search' },
  doj1993: { kind: 'gov', cite: 'U.S. Department of Justice, Report to the Deputy Attorney General on the Events at Waco, Texas, February 28 to April 19, 1993 (October 1993)', url: movDdg('Report to the Deputy Attorney General on the Events at Waco Texas 1993 Department of Justice'), link: 'search' },
  danforth2000: { kind: 'gov', cite: 'John C. Danforth (Special Counsel), Final Report to the Deputy Attorney General Concerning the 1993 Confrontation at the Mt. Carmel Complex, Waco, Texas (8 November 2000)', url: movDdg('Danforth Final Report 2000 Mt. Carmel Complex Waco Texas Special Counsel'), link: 'search' },
  branch1996: { kind: 'court', cite: 'United States v. Branch, 91 F.3d 699 (5th Cir. 1996), the appeal of the 1994 San Antonio trial of the Branch Davidians', url: 'https://static.case.law/f3d/91/cases/0699-01.json', link: 'direct' },
  andrade2003: { kind: 'court', cite: 'Andrade v. Chojnacki, 338 F.3d 448 (5th Cir. 2003), the appeal in the civil suit of surviving Branch Davidians and the estates of those who died against the United States (the take-nothing judgment was affirmed)', url: 'https://static.case.law/f3d/338/cases/0448-01.json', link: 'direct' },
  tabor1995: { kind: 'scholar', cite: 'James D. Tabor and Eugene V. Gallagher, Why Waco? Cults and the Battle for Religious Freedom in America (University of California Press, 1995)', url: movOl('Tabor Gallagher Why Waco Cults and the Battle for Religious Freedom in America'), link: 'search' },
  wright1995: { kind: 'scholar', cite: 'Stuart A. Wright (ed.), Armageddon in Waco: Critical Perspectives on the Branch Davidian Conflict (University of Chicago Press, 1995)', url: movOl('Stuart Wright Armageddon in Waco Critical Perspectives on the Branch Davidian Conflict'), link: 'search' },
  newport2006: { kind: 'scholar', cite: 'Kenneth G. C. Newport, The Branch Davidians of Waco: The History and Beliefs of an Apocalyptic Sect (Oxford University Press, 2006)', url: movOl('Newport The Branch Davidians of Waco The History and Beliefs of an Apocalyptic Sect'), link: 'search' },
  /* Solar Temple */
  mayer1999: { kind: 'scholar', cite: 'Jean-François Mayer, “‘Our Terrestrial Journey Is Coming to an End’: The Last Voyage of the Solar Temple”, Nova Religio 2(2), 1999, pp. 172–196', url: 'https://doi.org/10.1525/nr.1999.2.2.172', link: 'direct' },
  hall2000: { kind: 'scholar', cite: 'John R. Hall, with Philip D. Schuyler and Sylvaine Trinh, Apocalypse Observed: Religious Movements and Violence in North America, Europe, and Japan (Routledge, 2000)', url: movOl('Hall Schuyler Trinh Apocalypse Observed Religious Movements and Violence'), link: 'search' },
  /* NXIVM */
  raniere2019: { kind: 'court', cite: 'United States v. Raniere et al., No. 18-CR-204 (E.D.N.Y.), Judge Nicholas G. Garaufis: jury verdict of 19 June 2019 and sentence of 27 October 2020', url: movCl('"United States v. Raniere" 18-CR-204 Eastern District of New York'), link: 'search' },
  nyt2017: { kind: 'press', cite: 'Barry Meier, “Inside a Secretive Group Where Women Are Branded”, The New York Times, 17 October 2017', url: movDdg('Barry Meier "Inside a Secretive Group Where Women Are Branded" New York Times 2017'), link: 'search' },
  time2019: { kind: 'press', cite: 'Time, 2019, “NXIVM Leader Keith Raniere Has Been Convicted for Keeping Women as ‘Sex Slaves.’ Here Are the Major Players in the Case”: its estimate that 16,000 people enrolled in the courses', url: 'https://time.com/5568135/nxivm-allison-mack-raniere/', link: 'direct' },
  tu2012: { kind: 'press', cite: 'Reporting on NXIVM by the Albany Times Union (a series from 2012 onwards)', url: movDdg('Albany Times Union NXIVM investigation series Raniere'), link: 'search' },
  /* The Family International */
  ward1995: { kind: 'court', cite: 'Judgment of Lord Justice Ward in a custody case concerning children of members of the Family, High Court of Justice, London, 1995 (the “Ward judgment”); the account used is the CESNUR page on the English case', url: 'https://cesnur.org/testi/TheFamily/england.htm', link: 'direct' },
  palmer1999: { kind: 'scholar', cite: 'Susan J. Palmer and Charlotte Hardman (eds.), Children in New Religions (Rutgers University Press, 1999)', url: movOl('Palmer Hardman Children in New Religions'), link: 'search' },
  davis1984: { kind: 'testimony', cite: 'Deborah Davis (Linda Berg) with Bill Davis, The Children of God: The Inside Story (Zondervan, 1984)', url: movOl('Deborah Davis Linda Berg The Children of God The Inside Story'), link: 'search' },
  williams1998: { kind: 'testimony', cite: 'Miriam Williams, Heaven’s Harlots: My Fifteen Years as a Sacred Prostitute in the Children of God Cult (William Morrow, 1998)', url: movOl('Miriam Williams Heaven\'s Harlots'), link: 'search' },
  tfi_site: { kind: 'own', cite: 'The Family International, the group’s own site', url: 'https://www.tfionline.com/', link: 'direct' },
  /* the Rajneesh movement */
  torok1997: { kind: 'scholar', cite: 'Thomas J. Török and others, “A Large Community Outbreak of Salmonellosis Caused by Intentional Contamination of Restaurant Salad Bars”, JAMA 278(5), 1997, pp. 389–395', url: 'https://doi.org/10.1001/jama.1997.03550050051033', link: 'direct' },
  fitzgerald1986: { kind: 'press', cite: 'Frances FitzGerald, “Rajneeshpuram”, The New Yorker, 22 and 29 September 1986', url: movDdg('Frances FitzGerald "Rajneeshpuram" The New Yorker 1986'), link: 'search' },
  carter1990: { kind: 'scholar', cite: 'Lewis F. Carter, Charisma and Control in Rajneeshpuram: The Role of Shared Values in the Creation of a Premier Religious Community (Cambridge University Press, 1990)', url: movOl('Lewis Carter Charisma and Control in Rajneeshpuram'), link: 'search' },
  sheela1986: { kind: 'court', cite: 'United States v. Ma Anand Sheela and Ma Anand Puja (D. Or., 1986): Alford pleas of 22 July 1986 to charges arising from the poisoning plot and an attempted murder, and to wiretapping', url: movDdg('Ma Anand Sheela 1986 plea attempted murder wiretapping poisoning The Dalles Oregon'), link: 'search' },
  rajneesh1985: { kind: 'court', cite: 'United States v. Bhagwan Shree Rajneesh (D. Or., November 1985): Alford plea to two counts of immigration fraud; suspended sentence, probation, fine and departure from the United States', url: movDdg('Bhagwan Shree Rajneesh 1985 plea immigration fraud suspended sentence fine deported'), link: 'search' },
  osho_site: { kind: 'own', cite: 'Osho International Foundation, the movement’s own site', url: 'https://www.osho.com/', link: 'direct' },
  /* the Unification Church */
  moon1983: { kind: 'court', cite: 'United States v. Sun Myung Moon, 718 F.2d 1210 (2d Cir. 1983), cert. denied, 466 U.S. 971 (1984)', url: 'https://static.case.law/f2d/718/cases/1210-01.json', link: 'direct' },
  fraser1978: { kind: 'gov', cite: 'U.S. House of Representatives, Subcommittee on International Organizations, Investigation of Korean-American Relations (Report, 31 October 1978)', url: movDdg('Fraser Report 1978 Investigation of Korean-American Relations Subcommittee on International Organizations Moon organization'), link: 'search' },
  tokyo2025: { kind: 'court', cite: 'Tokyo District Court, order of 25 March 2025 to dissolve the Japanese religious corporation of the Family Federation for World Peace and Unification (appealed)', url: movDdg('Tokyo District Court 25 March 2025 dissolution order Family Federation Unification Church'), link: 'search' },
  kyodo2025: { kind: 'press', cite: 'News reports (Kyodo, NHK, The Japan Times) of the dissolution order of 25 March 2025 and of the church’s appeal', url: movDdg('Unification Church dissolution order Tokyo District Court March 2025 appeal Kyodo'), link: 'search' },
  asianews2025: { kind: 'press', cite: 'The Yomiuri Shimbun, via Asia News Network, 27 March 2025, “Japanese court wary of future harm from Unification Church, deems illegal donations were systemic, prolonged”: the Tokyo District Court’s reasoning in its order of 25 March 2025', url: 'https://asianews.network/japanese-court-wary-of-future-harm-from-unification-church-deems-illegal-donations-were-systemic-prolonged/', link: 'direct' },
  familyfed: { kind: 'own', cite: 'Family Federation for World Peace and Unification, the church’s own site', url: 'https://www.familyfed.org/', link: 'direct' },
  /* Raëlism */
  palmer2004: { kind: 'scholar', cite: 'Susan J. Palmer, Aliens Adored: Raël’s UFO Religion (Rutgers University Press, 2004)', url: movOl('Susan Palmer Aliens Adored Rael\'s UFO Religion'), link: 'search' },
  clonaid2002: { kind: 'press', cite: 'News reports of 27 December 2002 to January 2003 on Clonaid’s announcement of a cloned baby and the lack of any evidence for it (BBC News, CNN, The Guardian)', url: movDdg('Clonaid announcement December 2002 cloned baby Eve no evidence DNA test'), link: 'search' },
  rael_site: { kind: 'own', cite: 'The Raëlian Movement’s own site', url: 'https://www.rael.org/', link: 'direct' },
  /* the Twelve Tribes */
  vt1984: { kind: 'court', cite: 'Vermont District Court (Newport), order of 23 June 1984 returning to their parents the children taken in the Island Pond raid of 22 June 1984', url: movDdg('Island Pond raid June 1984 Twelve Tribes Vermont judge Mahady children returned'), link: 'search' },
  nyt1984: { kind: 'press', cite: 'Newspaper reports of 22–25 June 1984 on the Island Pond raid and the order returning the children (for example The New York Times)', url: movDdg('Island Pond Vermont raid 1984 112 children Northeast Kingdom Community Church New York Times'), link: 'search' },
  ap2013: { kind: 'press', cite: 'Associated Press report of September 2013 on the removal of about 40 children from Twelve Tribes communities in Bavaria after an undercover television report', url: movDdg('Twelve Tribes Bavaria September 2013 40 children removed undercover report Associated Press'), link: 'search' },
  spiegel2013: { kind: 'press', cite: 'Der Spiegel reports of September 2013 on the Twelve Tribes communities in Klosterzimmern and Wörnitz and the removal of children', url: movDdg('Der Spiegel Zwölf Stämme Klosterzimmern Kinder Inobhutnahme September 2013'), link: 'search' },
  twelve_site: { kind: 'own', cite: 'The Twelve Tribes communities’ own site', url: 'https://www.twelvetribes.org/', link: 'direct' },
  /* the FLDS */
  jeffs2011: { kind: 'court', cite: 'State of Texas v. Warren Steed Jeffs, Tom Green County, Texas: verdict of 4 August 2011 and sentence of 9 August 2011', url: movDdg('State of Texas v. Warren Jeffs 2011 verdict aggravated sexual assault life plus 20 years San Angelo'), link: 'search' },
  jeffs2010: { kind: 'court', cite: 'State v. Jeffs, 2010 UT 49, Utah Supreme Court (reversing the 2007 conviction for rape as an accomplice)', url: 'https://static.case.law/p3d/243/cases/1250-01.json', link: 'direct' },
  txdfps2008: { kind: 'court', cite: 'In re Texas Department of Family and Protective Services, 255 S.W.3d 613 (Tex. 2008), on the removal of children from the YFZ Ranch', url: 'https://static.case.law/sw3d/255/cases/0613-01.json', link: 'direct' },
  bradley1993: { kind: 'scholar', cite: 'Martha Sonntag Bradley, Kidnapped from That Land: The Government Raids on the Short Creek Polygamists (University of Utah Press, 1993)', url: movOl('Bradley Kidnapped from That Land Short Creek Polygamists'), link: 'search' },
  hales2006: { kind: 'scholar', cite: 'Brian C. Hales, Modern Polygamy and Mormon Fundamentalism: The Generations after the Manifesto (Greg Kofford Books, 2006)', url: movOl('Hales Modern Polygamy and Mormon Fundamentalism'), link: 'search' },
  bennion1998: { kind: 'scholar', cite: 'Janet Bennion, Women of Principle: Female Networking in Contemporary Mormon Polygyny (Oxford University Press, 1998)', url: movOl('Bennion Women of Principle Female Networking in Contemporary Mormon Polygyny'), link: 'search' },
  deseret2007: { kind: 'press', cite: 'Deseret News, 11 August 2007, “37,000 fundamentalists counted in and near Utah”: a census of fundamentalist Mormon groups compiled by Anne Wilde, with its figures for the FLDS Church (about 8,000, down from an estimate of about 10,000) and her caution that they were only estimates', url: 'https://www.deseret.com/2007/8/11/20034732/37-000-fundamentalists-counted-in-and-near-utah/', link: 'direct' },
  krakauer2003: { kind: 'press', cite: 'Jon Krakauer, Under the Banner of Heaven: A Story of Violent Faith (Doubleday, 2003)', url: movOl('Krakauer Under the Banner of Heaven'), link: 'search' },
  bistline2004: { kind: 'testimony', cite: 'Benjamin G. Bistline, The Polygamists: A History of Colorado City, Arizona (Agreka Books, 2004), by a former resident', url: movOl('Bistline The Polygamists A History of Colorado City Arizona'), link: 'search' },
};

/* entry: { id, name, also, atlas (an Atlas tradition id, or null), atlasNear, atlasNote, what, founded {y, t, g, s}, founder, where, status, now {t, g, s}, size [claims], overall (a MOV_OVERALL key), sure,
   self [claims], facts [claims], legal [{d, where, t, g, s}], response [claims], harm [{type, t, g, s, by?}], harmNote?, texts [{title, year, by, publisher, rights, here, lib?, note?}], books [library ids], further [source ids], care, review } */
const MOVEMENTS = [
  { id: 'scientology', name: 'Church of Scientology', also: 'Scientology; Dianetics (its first system)', atlas: 'scientology', atlasNear: null, atlasNote: '',
    what: 'Founded in Los Angeles in 1954 by L. Ron Hubbard, after his book Dianetics (1950); it describes itself as a religion, and courts in several countries have ruled on that and on its conduct',
    founded: { y: '1954', t: 'L. Ron Hubbard published Dianetics on 9 May 1950. The first Scientology organisations were founded in 1953, and in 1954 a Scientology church was founded in Los Angeles, which became the Church of Scientology International. Hubbard died on 24 January 1986.', g: 'reported', s: ['urban2011', 'wright2013'], r: 'ok', fx: 1 },
    founder: 'L. Ron Hubbard (1911–1986)', where: 'Founded in Los Angeles; its main centres are in Los Angeles and Clearwater, Florida; present in many countries.',
    status: 'active', now: { t: 'Active. Its main sites are in Los Angeles and Clearwater, and it has been led by Hubbard’s successor since 1986.', g: 'reported', s: ['urban2011', 'wright2013'], r: 'part' },
    size: [
      { t: 'The Church says that more than 11,000 Scientology churches, missions, related organisations and affiliated groups “minister to millions in 196 countries”.', g: 'own', s: ['scn_org'], r: 'ok', fx: 1 },
      { t: 'Independent counts are far lower: in countries whose censuses ask about religion, only a few thousand people give Scientology as their religion. England and Wales recorded 2,418 Scientologists in the 2011 census, and Australia recorded 1,655 in 2021 (2,163 in 2011).', g: 'reported', s: ['urban2011', 'lewis2009'], r: 'ok', fx: 1 },
    ],
    overall: 'courts',
    sure: 'The dates and the legal events below are documented in court records and official reports. What goes on inside the Church today is documented mostly by former members and by journalists who rely on them, and the Church disputes it; each claim says which is which.',
    self: [
      { t: 'The Church describes Scientology as “a religion that offers a precise path”. It teaches that each person is a “thetan”, “an immortal spiritual being”, and says that many people feel certain they have lived before, though past lives “is not a dogma in Scientology”. It teaches that “auditing”, which it also calls spiritual counselling, is done with an electropsychometer (the “E-Meter”) and “deletes life’s painful experiences”, leading to the state it calls “Clear”, in which a being no longer has “his own reactive mind”, and then to the higher “Operating Thetan” levels.', g: 'own', s: ['scn_org', 'urban2011'], r: 'ok', fx: 1 },
      { t: 'It describes auditing and training as religious services for which parishioners make “donations”, says that Scientologists are “not required to tithe or make other donations”, and says that donations “fund all Church-sponsored religious and Social Betterment activities”.', g: 'own', s: ['scn_org', 'urban2011'], r: 'ok', fx: 1 },
    ],
    facts: [
      { t: 'Dianetics: The Modern Science of Mental Health, published on 9 May 1950, sold more than 100,000 copies in its first two years. After the Dianetics foundation failed in 1952, Hubbard moved to Phoenix, Arizona, where he developed Scientology.', g: 'reported', s: ['urban2011', 'wright2013'], r: 'ok', fx: 1 },
      { t: 'Courts in several countries have been asked whether it counts as a religion for a particular law. Two answers, both yes: on 27 October 1983 Australia’s High Court held, unanimously, that Scientology is a religious institution exempt from Victoria’s pay-roll tax, and on 11 December 2013 the United Kingdom’s Supreme Court held that the Church’s London chapel is a “place of meeting for religious worship”, which the Registrar General was ordered to record under the Places of Worship Registration Act 1855, so that marriages can take place there.', g: 'record', s: ['newfaith1983', 'hodkin2013'], r: 'ok', fx: 1 },
      { t: 'In the United States the Internal Revenue Service recognised the Church of Scientology International and related churches as tax-exempt religious organisations in October 1993, after decades of dispute.', g: 'reported', s: ['urban2011', 'wright2013'], r: 'ok' },
      { t: 'Government inquiries were critical and did not end in a lasting ban. In Victoria, the 1965 Board of Inquiry (the Anderson report, dated 28 September 1965) concluded that “its continued practice should not be permitted”, and the Psychological Practices Act 1965 restricted it; the references to Scientology were taken out of the law in 1982. In Britain the Foster Report (1971) did not recommend a ban, called the laws adopted in Western and South Australia “discriminatory”, and recommended that foreign Scientologists be admitted again. The Home Secretary lifted the 1968 bar on foreigners coming to work or study for Scientology on 16 July 1980.', g: 'record', s: ['anderson1965', 'foster1971', 'hansard1980', 'urban2011'], r: 'ok', fx: 1 },
    ],
    legal: [
      { d: '1979–1981', where: 'United States District Court, Washington, D.C.', t: 'Operation Snow White. From 1973 members of the Church’s Guardian’s Office infiltrated government offices and stole documents, among them those of the Internal Revenue Service and the Department of Justice (one account counts 136 agencies, embassies and consulates). On 8 July 1977 the FBI executed search warrants at Scientology offices in Los Angeles and Washington. Mary Sue Hubbard (L. Ron Hubbard’s wife) and eight other senior Scientologists were convicted in the federal court in Washington and sentenced in December 1979; two more were convicted in 1980, eleven in all. L. Ron Hubbard was named an unindicted co-conspirator. The nine appealed, and the Court of Appeals for the District of Columbia decided the appeal on 2 October 1981 (United States v. Heldt).', g: 'record', s: ['heldt1981', 'wright2013'], r: 'ok', fx: 1 },
      { d: '1984', where: 'Los Angeles Superior Court', t: 'In the Church’s suit against a former member, Gerald Armstrong, Judge Paul Breckenridge ruled in June 1984 that the Church and Mary Sue Hubbard were to take nothing on their claims: the court accepted that Armstrong had taken the Church’s documents but held that he was justified, because he believed the Church threatened harm to him and his wife, and judgment was entered on 10 August 1984. In his written decision the judge criticised the Church’s treatment of its members and of people it saw as enemies (its “Fair Game” doctrine) and wrote that the evidence showed Hubbard had not been truthful about his history, background and achievements. The Court of Appeal affirmed the judgment in 1991.', g: 'record', s: ['armstrong1984', 'armstrong1991'], r: 'ok', fx: 1 },
      { d: '1998–2000', where: 'Pinellas County, Florida', t: 'The state charged the Church’s Clearwater organisation (the Flag Service Organization) in November 1998 with abuse or neglect of a disabled adult and practising medicine without a licence, over the death of Lisa McPherson in 1995 (see Harm). The state dropped the charges in June 2000, the prosecutor writing that the medical examiner’s expected testimony would create a reasonable doubt on crucial forensic issues; her family’s civil suit was settled on confidential terms in 2004.', g: 'record', s: ['mcpherson', 'wright2013'], r: 'ok', fx: 1 },
      { d: '27 October 2009', where: 'Paris criminal court', t: 'The court convicted the Celebrity Centre and a Scientology bookshop, and several individuals, of organised fraud (escroquerie en bande organisée) against recruits, and fined the two organisations €400,000 and €200,000. The Paris Court of Appeal upheld the convictions on 2 February 2012, and the Court of Cassation rejected the final appeals on 16 October 2013.', g: 'record', s: ['paris2009', 'petitjuriste'], r: 'ok', fx: 1 },
    ],
    response: [
      { t: 'The Church says that Operation Snow White was the work of the Guardian’s Office, which it says acted wrongly and without Hubbard’s knowledge, that those responsible were removed and the office was replaced in the early 1980s.', g: 'own', s: ['wright2013', 'urban2011'], r: 'nf' },
      { t: 'It says it is a religion that has met discrimination from governments (it names the United States and Germany) and misinformation from parts of the press, that the former members who speak against it make false claims and are “disgruntled” or have an agenda against it, that the label “Fair Game” for critics was cancelled by Hubbard in 1968, and that any claim that it has a “fair game” policy is false.', g: 'own', s: ['scn_org', 'scn_news2015', 'scn_hbo2015'], r: 'ok', fx: 1 },
      { t: 'On “disconnection” it says it does not order anyone to cut off relatives, and that each person chooses whom to keep in contact with.', g: 'own', s: ['wright2013', 'urban2011'], r: 'ok' },
    ],
    harm: [
      { type: 'deaths', t: 'Lisa McPherson, aged 36 and a Scientologist, died on 5 December 1995 in Clearwater, Florida, after 17 days at the Fort Harrison Hotel in the care of Scientology staff. On 18 November 1995, after a minor car accident in which she began to remove her clothes, she was taken to a hospital; she refused psychiatric observation there and left, and was then taken to the hotel. The county medical examiner’s first finding was that she died of a blood clot in the lung (a pulmonary embolism) caused by bed rest and severe dehydration, with the manner of death undetermined; in 2000 the medical examiner changed the manner of death to accident and dropped the reference to dehydration. The charges that followed were dropped in 2000 (see Legal outcomes). The Church says she was brought to the hotel for rest and relaxation and watched round the clock; her family sued it for wrongful death.', g: 'record', s: ['mcpherson', 'wright2013'], r: 'part', fx: 1 },
      { type: 'financial', t: 'In 2009 a French court found that Scientology organisations had defrauded recruits out of their savings (see Legal outcomes).', g: 'record', s: ['paris2009', 'petitjuriste'], r: 'ok', fx: 1 },
      { type: 'family', t: 'Former members describe “disconnection”: being told to cut off contact with relatives and friends who criticise the Church (called “suppressive persons”). The Church denies that it orders this.', g: 'testimony', by: 'former members', s: ['hill2013', 'wright2013'], r: 'ok' },
      { type: 'labour', t: 'Former members of the Sea Org, the Church’s religious order, say members sign contracts for a billion years, work long hours for very little pay, and can be sent to punishing “rehabilitation” work for disobeying. The Church says the billion-year pledge is “a symbolic document”.', g: 'testimony', by: 'former Sea Org members', s: ['hill2013', 'wright2013'], r: 'ok', fx: 1 },
    ],
    texts: [
      { title: 'Dianetics: The Modern Science of Mental Health', year: '1950', by: 'L. Ron Hubbard', publisher: 'Hermitage House first; now Bridge Publications (United States) and New Era Publications (elsewhere)', rights: 'In copyright; the rights are held by organisations of the Church', here: false },
      { title: 'Scientology: The Fundamentals of Thought', year: '1956', by: 'L. Ron Hubbard', publisher: 'Bridge Publications and New Era Publications', rights: 'In copyright; the rights are held by organisations of the Church', here: false },
    ],
    books: [], further: ['urban2011', 'lewis2009', 'wright2013', 'scn_org'],
    care: 'Scientologists are real people, many of them ordinary families who find meaning in their practice. This card records what courts, inquiries and journalists found about the organisation and sets the Church’s account beside it; it says nothing about any member’s character. Understood, not endorsed.',
    review: 'unchecked' },

  { id: 'peoples_temple', name: 'Peoples Temple', also: 'Jonestown, its settlement in Guyana', atlas: null, atlasNear: 'restoration_movement', atlasNearName: 'Restoration (Stone–Campbell) Movement',
    atlasNote: 'The map data has no record of Peoples Temple. It was a congregation of the Christian Church (Disciples of Christ) from 1959 or 1960, so the nearest religion on the map is the Restoration (Stone–Campbell) Movement, which the Disciples belong to.',
    what: 'Founded in Indianapolis in 1955 by Jim Jones; a Christian congregation that became a communal and political movement',
    founded: { y: '1955', t: 'Jim Jones, a student pastor in Indianapolis from 1952, founded his own church there in 1954 and in 1955 renamed it the Peoples Temple Full Gospel Church (later shortened to Peoples Temple). The congregation joined the Christian Church (Disciples of Christ) in 1959 (“by 1960”, says the Jonestown Institute), and in July 1965 Jones and his followers began moving to Redwood Valley, California.', g: 'reported', s: ['moore2009', 'chidester1988'], r: 'ok', fx: 1 },
    founder: 'Jim Jones (1931–1978)', where: 'Indianapolis; then Redwood Valley, San Francisco and Los Angeles, California; from 1974 an agricultural settlement at Jonestown, in Guyana.',
    status: 'ended', now: { t: 'Peoples Temple ended with the deaths of 18 November 1978; it declared bankruptcy at the end of that year and the petition was granted in January 1979. The Jonestown Institute, a project of the University Library at San Diego State University, keeps and publishes its records, recordings and survivors’ and relatives’ accounts.', g: 'reported', s: ['moore2009', 'jonestown'], r: 'ok', fx: 1 },
    size: [{ t: 'More than 900 of the people living at Jonestown died on 18 November 1978. The Temple’s California membership ran to thousands at its height; counts differ.', g: 'reported', s: ['moore2009', 'reiterman1982'], r: 'ok' }],
    overall: 'courts',
    sure: 'The airstrip attack, the deaths and the official account of 1979 are well documented. What happened inside the Temple earlier rests largely on former members’ accounts and the reporting that followed them, and scholars still argue over how to describe the final meeting.',
    self: [
      { t: 'Jones led the Temple as an integrated church that opened a soup kitchen for the poor in 1960, ran at least nine residential care homes for the elderly and drug-rehabilitation programmes, and preached racial equality and a socialist community; later he encouraged members to follow him to Guyana, and in rehearsals he called “White Nights” he told members that outsiders would attack and set before them four choices, one of them “revolutionary suicide”.', g: 'own', s: ['jonestown', 'chidester1988'], r: 'part', fx: 1 },
      { t: 'The Temple’s own tape recordings, now held by the Jonestown Institute, include Jim Jones calling the Guyana settlement “our Promised Land” (tape Q987) and, in a rehearsal for a reporter’s visit, a resident answering that she came because of racism in the United States (tape Q279).', g: 'own', s: ['jonestown', 'moore2009'], r: 'ok', fx: 1 },
    ],
    facts: [
      { t: 'The Temple was a racially mixed congregation of thousands, unusual in the United States of its day, and its leaders, Jones among them, took part in San Francisco politics in the 1970s. In 1974 it leased land in Guyana for a settlement, and in 1977 Jones and hundreds of members moved there.', g: 'reported', s: ['moore2009', 'chidester1988', 'reiterman1982'], r: 'ok' },
      { t: 'In 1977 New West magazine published an investigation of the Temple, by Marshall Kilduff and Phil Tracy, that carried former members’ allegations of abuse; the first public exposé had been a newspaper series in 1972. Jones left for Guyana that year.', g: 'reported', s: ['kilduff1977', 'reiterman1982'], r: 'ok', fx: 1 },
      { t: 'On 17 November 1978 Congressman Leo Ryan visited Jonestown to look into complaints from relatives and former members. On 18 November, as his party and some Temple members who wished to leave boarded planes at the Port Kaituma airstrip, Temple gunmen attacked them: Ryan, three journalists (Don Harris and Bob Brown of NBC and Greg Robinson of the San Francisco Examiner) and one of the departing members, Patricia Parks, were killed.', g: 'record', s: ['house1979', 'reiterman1982'], r: 'ok' },
      { t: 'The deaths are often called a “mass suicide”. Scholars point out that about a third of the dead at Jonestown were children, who did not choose it, that armed guards were present, and that the tape of the last meeting records both pressure and objections; many use “murder-suicide” and treat as unsettled how many chose it.', g: 'reported', s: ['moore2009', 'chidester1988'], r: 'ok' },
    ],
    legal: [
      { d: '15 May 1979', where: 'United States House of Representatives', t: 'A staff investigative group of the House Committee on Foreign Affairs published its report on the killing of Congressman Ryan and the Jonestown deaths, the official account of the events.', g: 'record', s: ['house1979'], r: 'ok' },
      { d: '1986', where: 'United States federal court, San Francisco', t: 'Larry Layton, a Temple member who took part in the attack at the airstrip, was convicted in 1986 in a federal court of conspiracy to murder Congressman Ryan and of aiding and abetting his murder, and was sentenced to life in prison. The Ninth Circuit affirmed the judgment on 16 August 1988.', g: 'record', s: ['layton1988'], r: 'ok', fx: 1 },
    ],
    response: [
      { t: 'No group speaks for the Temple today. The Jonestown Institute, a project of the University Library at San Diego State University, says that its primary purpose is “to present information about Peoples Temple as accurately and objectively as possible” and that the story of Jonestown “did not start or end on 18 November 1978”.', g: 'own', s: ['jonestown'], r: 'part', fx: 1 },
    ],
    harm: [
      { type: 'deaths', t: '918 people died on 18 November 1978: 909 at Jonestown, five at the Port Kaituma airstrip and four, a mother and her three children, in Georgetown. About a third of those who died at Jonestown were children.', g: 'record', s: ['house1979', 'moore2009', 'jonestown918'], r: 'ok' },
      { type: 'violence', t: 'Members were beaten and humiliated in meetings, and at Jonestown people were guarded and could not leave freely, according to former members. The House staff report of 1979 speaks of interrogations involving “harassment, humiliation, revilement, and degradation” and of severe beatings.', g: 'testimony', by: 'former members, to a magazine in 1977 and to Congress in 1979', s: ['kilduff1977', 'house1979'], r: 'part', fx: 1 },
      { type: 'financial', t: 'According to former members, members were asked to sign over homes and savings and to hand over welfare, pension and social-security payments. The House staff report of 1979 lists among the Temple’s practices “requiring People’s Temple members to contribute as much as 25 percent of their income and sign over to the People’s Temple their properties and other assets”.', g: 'testimony', by: 'former members, to the House inquiry and the press', s: ['house1979', 'kilduff1977'], r: 'ok', fx: 1 },
    ],
    texts: [
      { title: 'Sermons, newsletters and the recordings of the last meeting', year: '1955–1978', by: 'Jim Jones and Peoples Temple', publisher: 'Not published as books. The FBI’s recordings are US government records and are online at the Jonestown Institute', rights: 'Government records and an archive; the copyright of the Temple’s own sermons was not checked', here: false },
    ],
    books: [], further: ['jonestown', 'moore2009', 'chidester1988', 'reiterman1982', 'house1979'],
    care: 'Everyone who died at Jonestown was a person with a family, and most were not leaders. This card records what happened and does not mock or blame the people who followed.',
    review: 'unchecked' },

  { id: 'heavens_gate', name: 'Heaven’s Gate', also: 'Human Individual Metamorphosis; Total Overcomers Anonymous', atlas: 'heavens_gate', atlasNear: null, atlasNote: '',
    what: 'Begun in Texas in the mid-1970s by Marshall Applewhite and Bonnie Nettles; by its own account a teaching drawn from Revelation 11 about a “Next Level” that a spacecraft would reach',
    founded: { y: '1974', t: 'The founders, Marshall Applewhite and Bonnie Nettles, met in 1972 and began teaching in the mid-1970s (the map data uses 1974). The group had several names, among them Total Overcomers Anonymous from 1993, before it was called Heaven’s Gate.', g: 'reported', s: ['balch2002', 'zeller2014'], r: 'ok', fx: 1 },
    founder: 'Marshall Applewhite (1931–1997) and Bonnie Nettles (1927–1985)', where: 'Texas, then travelling in the western United States; its last home was a rented house in Rancho Santa Fe, near San Diego, California.',
    status: 'ended', now: { t: 'Ended in March 1997 with the deaths of 39 members. Two former members are believed to keep the group’s web site online.', g: 'record', s: ['sdme1997', 'zeller2014'], r: 'ok', fx: 1 },
    size: [{ t: 'There were 39 members at the end.', g: 'record', s: ['sdme1997'], r: 'ok' }],
    overall: 'courts',
    sure: 'The number and ages of the dead and the drugs found are documented in the medical examiner’s findings as the press of the time reported them; the medical examiner’s autopsy results of 11 April 1997 are in a news report of the time (all 39 had killed themselves), but his own wording of the final rulings was not in the pages read. The beliefs rest on the group’s own writings and videos, which exist in large number, and scholars largely agree on what they said.',
    self: [
      { t: 'The members believed that Applewhite and Nettles were the two witnesses of Revelation 11 and representatives of “the Level Above Human”; that human bodies are vehicles to be left behind; and that members could “graduate” to the Next Level, which a spacecraft following the comet Hale–Bopp would carry them to.', g: 'own', s: ['hg_site', 'zeller2014'], r: 'ok' },
      { t: 'The group’s own page “Our Position Against Suicide” says that “the true meaning of ‘suicide’ is to turn against the Next Level when it is being offered”, and that its members expected to board a spacecraft from the Next Level “in our physical bodies”.', g: 'own', s: ['hg_site', 'zeller2014'], r: 'ok', fx: 1 },
    ],
    facts: [
      { t: 'Applewhite had been chair of the music department at the University of St. Thomas in Houston, which he left in 1970, and choral director of an Episcopal church; Nettles was a nurse. In the mid-1970s around twenty people left their homes and families to join them, and the story was reported on national television (CBS Evening News).', g: 'reported', s: ['balch2002', 'zeller2014'], r: 'ok', fx: 1 },
      { t: 'In the 1990s the group supported itself by building web sites for businesses, under the name Higher Source.', g: 'reported', s: ['zeller2014', 'balch2002'], r: 'ok' },
    ],
    legal: [
      { d: '1997', where: 'San Diego County, California', t: 'No criminal charges followed, since all those responsible died in the deaths. Investigators said at the time that they saw no sign of murder and no hint that any member survived, and on 11 April 1997 the county medical examiner’s autopsy results were reported to show that all 39, including the leader, Marshall Applewhite, had killed themselves with a mix of drugs, alcohol and plastic bags.', g: 'record', s: ['sdme1997', 'deseret1997a', 'deseret1997c'], r: 'part', fx: 1 },
    ],
    response: [
      { t: 'The group’s own site, which is still online, says the members chose to leave their bodies (“vehicles”, in its word) and that this was not suicide in the group’s sense of the word, which it describes as turning against the Next Level when it is offered.', g: 'own', s: ['hg_site'], r: 'ok', fx: 1 },
    ],
    harm: [
      { type: 'deaths', t: 'On 26 March 1997 sheriff’s deputies found 39 bodies (21 women and 18 men, aged 26 to 72) in a rented house in Rancho Santa Fe, California. The San Diego County medical examiner’s tests found phenobarbital in the members’ blood and alcohol in all but six, and reports at the time said most of the bodies had plastic bags over their heads; the first report did not state a cause of death, and investigators said they saw no indication of murder. Most of the members had recorded farewell videos beforehand.', g: 'record', s: ['sdme1997', 'zeller2014', 'deseret1997a', 'deseret1997b'], r: 'ok', fx: 1 },
      { type: 'health', t: 'Autopsies found that several of the men, Applewhite among them, had been castrated, in some cases long before 1997. Sources give the number as seven or as eight. Accounts of the group describe the surgery as voluntary and as a way of keeping to its ascetic life.', g: 'record', s: ['sdme1997', 'balch2002', 'deseret1997a'], r: 'ok', fx: 1 },
      { type: 'family', t: 'Members took new names, gave up their possessions and, under the group’s rules, ordinary contact with family and sexual relations. Scholars describe this as a deliberate break from the old life that the leaders required and the members accepted.', g: 'reported', s: ['balch2002', 'zeller2014'], r: 'ok' },
    ],
    texts: [
      { title: 'How and When “Heaven’s Gate” May Be Entered', year: '1996', by: 'Marshall Applewhite and the group', publisher: 'Published on the group’s own web site', rights: 'Held by the group; not reproduced here', here: false, note: 'The group’s site is still online. This page does not copy it.' },
      { title: 'Exit statements and videos', year: '1997', by: 'The members', publisher: 'Kept on the group’s own site', rights: 'Held by the group; not reproduced here', here: false },
    ],
    books: ['n-rev'], further: ['zeller2014', 'balch2002', 'lalich2004', 'hg_site'],
    care: 'These were adults, some of them members for twenty years, and their relatives lost them. The group asked that what they did not be called suicide; this card gives the medical examiner’s ruling and the group’s own account side by side. Nothing of the group’s teaching or recruiting material is reproduced here.',
    review: 'unchecked' },

  { id: 'aum_shinrikyo', name: 'Aum Shinrikyo (now Aleph and Hikari no Wa)', also: 'Aum; Aleph; Hikari no Wa (the Circle of Rainbow Light)', atlas: 'aum_shinrikyo', atlasNear: null, atlasNote: '',
    what: 'Founded in Tokyo in 1984 by Shoko Asahara as a yoga school; a yoga- and Buddhist-based movement that took an apocalyptic turn',
    founded: { y: '1984', t: 'Chizuo Matsumoto, who took the name Shoko Asahara, opened a yoga school in Tokyo in 1984. It became Aum Shinrikyo in 1987 and was registered as a religious corporation in 1989.', g: 'reported', s: ['reader2000', 'lifton1999', 'senate1995'], r: 'ok' },
    founder: 'Shoko Asahara (Chizuo Matsumoto, 1955–2018)', where: 'Tokyo; its communities were at Kamikuishiki, near Mount Fuji, and elsewhere in Japan, with branches in Russia and other countries.',
    status: 'changed', now: { t: 'A court ordered the religious corporation dissolved in October 1995. Two groups descend from it, Aleph (the name taken in 2000) and Hikari no Wa (founded in 2007), and the Japanese authorities have kept both under surveillance under an anti-Aum law.', g: 'record', s: ['psia', 'reader2000'], r: 'ok', fx: 1 },
    size: [{ t: 'A 1995 US Senate staff statement puts its membership at about 10,000 in 1992 and about 50,000 worldwide in 1995, and says that the group claimed as many as 65,000 members, most of them (30,000 to 50,000) in Russia.', g: 'reported', s: ['senate1995', 'reader2000'], r: 'ok', fx: 1 }],
    overall: 'courts',
    sure: 'The attacks, the trials and the executions are documented in court and official records and agree across sources. How its teaching led to violence is argued by scholars: Reader and Lifton, for instance, stress different things.',
    self: [
      { t: 'Asahara taught a mixture of yoga, early Buddhism and Tibetan Buddhism, Hindu devotion to Shiva and the Christian apocalypse. He claimed to have reached final liberation and to be able to lead others to it, and taught that the world would end in a war that would destroy most people, and that Aum’s members would survive to build a new world.', g: 'own', s: ['reader2000', 'lifton1999'], r: 'ok' },
    ],
    facts: [
      { t: 'Aum recruited many young, highly educated people, among them scientists and engineers; it organised itself in “ministries” like a government, and many members left their families and gave their property to the group.', g: 'reported', s: ['reader2000', 'lifton1999'], r: 'ok' },
      { t: 'A 1995 United States Senate staff statement examined how Aum made and tried to obtain chemical, biological and other weapons.', g: 'record', s: ['senate1995'], r: 'ok' },
    ],
    legal: [
      { d: '27 February 2004', where: 'Tokyo District Court', t: 'Shoko Asahara was sentenced to death. The sentence became final in September 2006, when the Supreme Court of Japan rejected the last appeal. Twelve other members were also sentenced to death.', g: 'record', s: ['tokyo2004', 'reader2000'], r: 'ok' },
      { d: '6 and 26 July 2018', where: 'Japan', t: 'Asahara and six others were executed on 6 July 2018, and the other six members under sentence of death on 26 July 2018.', g: 'record', s: ['tokyo2004', 'nhk2018'], r: 'ok' },
      { d: '1995 onward', where: 'Japan', t: 'A court ordered Aum dissolved as a religious corporation in October 1995, and it was declared bankrupt in early 1996. An anti-Aum law passed later requires the groups descended from it to submit lists of members and details of their assets to the authorities, who keep them under surveillance; it has been applied to Aleph and Hikari no Wa.', g: 'record', s: ['psia', 'reader2000'], r: 'ok', fx: 1 },
    ],
    response: [
      { t: 'In 2000 the group, renamed Aleph, apologised to the victims of the sarin attack and set up a compensation fund; it says that those who carried out the attacks did so in secret, without their plans being known to other executives and ordinary believers. Hikari no Wa, founded in 2007 by a former Aum spokesman, says it has discarded the influence of Asahara.', g: 'own', s: ['psia', 'reader2000'], r: 'ok', fx: 1 },
    ],
    harm: [
      { type: 'deaths', t: 'Aum members killed a member who tried to leave in February 1989 and, in November 1989, the lawyer Tsutsumi Sakamoto, his wife and their infant son, and others later. Asahara was convicted on 13 of 17 charges, among them the Sakamoto family murder.', g: 'record', s: ['tokyo2004', 'reader2000'], r: 'ok', fx: 1 },
      { type: 'violence', t: 'On 27 June 1994 members released sarin gas in Matsumoto, killing eight people (seven that night, one later) and harming more than 500. On 20 March 1995 they released it on five trains of the Tokyo subway, killing thirteen people (some counts say fourteen) and injuring thousands.', g: 'record', s: ['tokyo2004', 'senate1995', 'lifton1999'], r: 'ok', fx: 1 },
    ],
    texts: [
      { title: 'Initiation (Shoko Asahara)', year: '1987', by: 'Shoko Asahara', publisher: 'Aum Publishing, Tokyo (Japanese)', rights: 'Rights not checked; not reproduced here', here: false, note: 'The Text catalogue has a record of it.' },
    ],
    books: ['x-dhp', 'x-yog', 'x-bar'], further: ['reader2000', 'lifton1999', 'senate1995', 'psia'],
    care: 'Aum’s victims and their families are the first people this card is for. The Buddhist, yoga and Hindu texts listed beside it belong to the whole world; they are not answerable for what one man did with them, and the Library holds them so that they can be read for themselves.',
    review: 'unchecked' },

  { id: 'branch_davidians', name: 'Branch Davidians', also: 'Davidian Seventh-day Adventists (the earlier group); the Mount Carmel community', atlas: 'branch_davidians', atlasNear: null, atlasNote: '',
    what: 'Begun near Waco, Texas, in 1935 by Victor Houteff; a Bible-based end-times movement that grew out of Adventism',
    founded: { y: '1929', t: 'Victor Houteff began teaching in 1929 (the map data’s date) and was expelled from the Seventh-day Adventist Church in the 1930s; he founded the Davidian Seventh-day Adventists at Mount Carmel, near Waco, Texas, in 1935. Benjamin Roden formed the Branch in 1955, and from the late 1980s it was led by Vernon Howell, who legally took the name David Koresh in 1990.', g: 'reported', s: ['newport2006', 'tabor1995'], r: 'ok' },
    founder: 'Victor Houteff (1885–1955); Benjamin Roden (1902–1978); David Koresh (1959–1993)', where: 'Mount Carmel Center, near Waco, Texas.',
    status: 'changed', now: { t: 'The Mount Carmel community ended on 19 April 1993. Small groups that keep the Davidian heritage continue in Texas and elsewhere.', g: 'reported', s: ['newport2006', 'tabor1995'], r: 'ok' },
    size: [{ t: 'About 115 men, women and children, aged from six months to seventy years, lived at Mount Carmel when the ATF went ahead with its raid on 28 February 1993, according to the Fifth Circuit’s opinion in the Davidians’ criminal appeal.', g: 'record', s: ['branch1996', 'doj1993', 'danforth2000'], r: 'ok', fx: 1 }],
    overall: 'courts',
    sure: 'The siege, the deaths and the official findings are well documented and agree across the reports. Who started the final fire was argued for years; the 2000 report settled it for the government, though some survivors and scholars still differ. The claims about Koresh and girls come from sworn statements and were never tried, because he died. The Justice Department’s and Treasury’s reports could not be opened when the claims were read against sources on 22 November 2026.',
    self: [
      { t: 'Koresh taught that he was the “Lamb” of Revelation who alone could open the seven seals of the book (Revelation 5–8) and explain the end of the world. The group studied the Bible together daily and held that the final conflict, the opening of the “fifth seal”, was near.', g: 'own', s: ['newport2006', 'tabor1995'], r: 'part' },
    ],
    facts: [
      { t: 'Koresh’s authority over doctrine and over members’ marriages and sexual lives was, in these accounts, final within the community.', g: 'reported', s: ['newport2006', 'tabor1995'], r: 'part' },
      { t: 'On 28 February 1993 agents of the Bureau of Alcohol, Tobacco and Firearms (ATF) tried to serve search and arrest warrants for illegal firearms at Mount Carmel. A gun battle began in which four ATF agents and six Davidians were killed, and the FBI besieged the compound for 51 days.', g: 'record', s: ['doj1993', 'treasury1993', 'danforth2000'], r: 'ok' },
      { t: 'On 19 April 1993 the FBI used tear gas (CS) to force the Davidians out. Fires broke out and 76 Davidians died, Koresh among them and more than twenty of them children; nine people survived.', g: 'record', s: ['doj1993', 'danforth2000'], r: 'ok' },
      { t: 'The 1993 Treasury report criticised the ATF’s planning and conduct of the raid. The 2000 Danforth report concluded that Davidians started the fires and that government agents did not fire on the Davidians on 19 April.', g: 'record', s: ['treasury1993', 'danforth2000'], r: 'part' },
    ],
    legal: [
      { d: 'February 1994', where: 'Federal court, San Antonio, Texas', t: 'Eleven Branch Davidians were tried in 1994. The jury acquitted them of murder and conspiracy to murder; it convicted five of aiding and abetting voluntary manslaughter and eight of firearms offences, and sentences of up to 40 years followed. In 1996 the Fifth Circuit vacated the sentences for use of machine guns and left the verdicts undisturbed in all other respects (United States v. Branch).', g: 'record', s: ['branch1996'], r: 'ok', fx: 1 },
    ],
    response: [
      { t: 'Surviving Branch Davidians and their families say that the ATF raid was an unprovoked attack on a religious community, that the government’s tear-gas assault led to the final fire, and that the group had been willing to talk.', g: 'own', s: ['tabor1995', 'wright1995', 'andrade2003'], r: 'part' },
      { t: 'Scholars of religion criticised how officials treated the group. During the siege several of them told the FBI that its tactics would reinforce the group’s sense of a final confrontation and make a violent end more likely; two of them, Phillip Arnold and James Tabor, studied Koresh’s teaching for the FBI, and Koresh asked to discuss the Bible with Arnold, which the FBI refused. Tabor and Gallagher later argued that two decades of activity against so-called “cults” had shaped how the public saw unorthodox religions. The Danforth report disagreed that the government caused the fire.', g: 'reported', s: ['tabor1995', 'wright1995'], r: 'ok', fx: 1 },
    ],
    harm: [
      { type: 'deaths', t: 'Four ATF agents and six Davidians died on 28 February 1993, and 76 Davidians on 19 April, more than twenty of them children. In all, more than eighty Davidians and four federal agents died.', g: 'record', s: ['doj1993', 'danforth2000'], r: 'ok' },
      { type: 'sexual', t: 'Government reports and former members state that Koresh took many women and girls as “wives”, among them girls under seventeen, the age of consent in Texas. The 1993 Treasury report and the Danforth report cite sworn statements by former members. Koresh died before any trial, and some surviving Davidians dispute the accounts.', g: 'alleged', by: 'former members, in sworn statements cited in the 1993 and 2000 government reports', s: ['treasury1993', 'danforth2000'], r: 'part' },
    ],
    texts: [
      { title: 'The Shepherd’s Rod', year: '1930s', by: 'Victor Houteff', publisher: 'Universal Publishing Association (Davidian Seventh-day Adventists)', rights: 'Rights not checked: it may be out of copyright or still held by Davidian groups', here: false, note: 'The Text catalogue lists it (1930).' },
      { title: 'Recorded sermons and written commentary on the seven seals', year: '1980s–1993', by: 'David Koresh', publisher: 'Held in archives and by Davidian groups', rights: 'Held by the heirs and the groups; not reproduced here', here: false },
    ],
    books: ['n-rev', 'b-dan'], further: ['tabor1995', 'wright1995', 'newport2006', 'danforth2000', 'doj1993'],
    care: 'Children died at Mount Carmel, and the survivors lost their community and many of their families. This card records what the reports say and also that scholars have long criticised the way the government handled it. The Revelation and Daniel texts beside it are the Bible, which the group read as most Christians do not.',
    review: 'unchecked' },

  { id: 'solar_temple', name: 'Order of the Solar Temple', also: 'Ordre du Temple Solaire (OTS)', atlas: null, atlasNear: 'rosicrucianism', atlasNearName: 'Rosicrucianism',
    atlasNote: 'The map data has no record of the Order of the Solar Temple. It drew on Rosicrucian and neo-Templar ideas, so the nearest religion on the map is Rosicrucianism.',
    what: 'Founded around Geneva in 1984 by Joseph Di Mambro and Luc Jouret; an esoteric order in the Rosicrucian and neo-Templar tradition',
    founded: { y: '1984', t: 'Joseph Di Mambro and Luc Jouret founded the order out of a split from another neo-Templar group, the Renewed Order of the Temple, and it was formally created in Geneva on 21 June 1984 as the International Chivalric Order of the Solar Tradition (Ordre International Chevaleresque Tradition Solaire).', g: 'reported', s: ['mayer1999', 'hall2000'], r: 'ok', fx: 1 },
    founder: 'Joseph Di Mambro (1924–1994) and Luc Jouret (1947–1994)', where: 'Geneva, Switzerland; members in Switzerland, France and Quebec (Canada) and other countries.',
    status: 'ended', now: { t: 'Ended with the deaths of 1994 to 1997. This card does not follow any later groups.', g: 'reported', s: ['mayer1999', 'hall2000'], r: 'ok' },
    size: [{ t: 'At its height, in January 1989, the order had 442 members: 187 in France, 90 in Switzerland, 86 in Canada, 53 in Martinique, 16 in the United States and 10 in Spain.', g: 'reported', s: ['mayer1999', 'hall2000'], r: 'ok', fx: 1 }],
    overall: 'reported',
    sure: 'The number and dates of the deaths are well documented in the scholarship and the official inquiries it draws on. Which deaths were chosen and which were murders is argued by scholars. The court outcomes in Switzerland, Canada and France were read on one reference page only (see the note under Legal outcomes).',
    self: [
      { t: 'The Order taught a mystical Christianity that mixed Rosicrucian and Templar lore: that a hidden hierarchy of “Masters” guided the world, that its members had a mission to prepare for a coming age, and that at death they could pass to another plane, symbolised by the star Sirius, in a “transit”.', g: 'own', s: ['mayer1999', 'hall2000'], r: 'part' },
      { t: 'In letters sent around the time of the 1994 deaths the group termed them a “transit”, which it described as “in no way a suicide in the human sense of the term”.', g: 'own', s: ['mayer1999'], r: 'ok', fx: 1 },
    ],
    facts: [
      { t: 'Jouret, a Belgian doctor and homeopath, drew members through lectures on alternative medicine, ecology and spirituality, and Di Mambro led the order, with Jouret as its spokesman. Former members, among them a son of Di Mambro, say that the apparitions of the “Masters” in the order’s ceremonies were staged with props and holographic projections.', g: 'reported', s: ['mayer1999', 'hall2000'], r: 'ok', fx: 1 },
    ],
    legal: [],
    legalNote: 'Di Mambro and Jouret died in the deaths of October 1994, so there was no trial of them. One reference page says that in Canada in 1993, before the deaths, Jouret and two other men were given a symbolic sentence for arms trafficking (a conditional discharge, a year of unsupervised probation and a fine of $1,000), and that in France a man tried over the deaths of 1995 was acquitted twice. The trials and inquiries themselves were not read.',
    response: [],
    responseNote: 'No successor group is known to speak for the Order on the record used here.',
    harm: [
      { type: 'deaths', t: '74 members died between 1994 and 1997 in four events. In early October 1994, 48 died in two villages in Switzerland (23 at Cheiry and 25 at Granges-sur-Salvan) and five at Morin-Heights, Quebec; in December 1995, 16 died in the Vercors mountains in France; and in March 1997, five died at Saint-Casimir, Quebec. Di Mambro and Jouret were among the dead of October 1994.', g: 'reported', s: ['mayer1999', 'hall2000'], r: 'part', fx: 1 },
      { type: 'violence', t: 'Investigators in Switzerland, Canada and France concluded, as scholars report, that some of the dead had been shot or smothered and had not chosen death, among them children, and that the first victims in Quebec, a couple and their three-month-old son, were killed by other members, whom the leaders had accused of betraying the Order.', g: 'reported', s: ['mayer1999', 'hall2000'], r: 'part' },
    ],
    texts: [
      { title: 'The Order’s letters and teaching papers, including the “transit” letters of 1994', year: '1984–1994', by: 'The Order’s leaders', publisher: 'Not published as books; held in inquiry files and archives', rights: 'Not reproduced here', here: false },
    ],
    books: ['h-fama', 'h-rosi'], further: ['mayer1999', 'hall2000'],
    care: 'The dead included children, and some of the adults did not choose to die. Survivors and the families of the dead are living people; this card keeps to the scholars’ and inquiries’ findings. The Rosicrucian texts beside it are old and public, and are not the Order’s teaching.',
    review: 'unchecked' },

  { id: 'nxivm', name: 'NXIVM', also: 'Executive Success Programs; Rational Inquiry; DOS, a secret women’s group inside it', atlas: null, atlasNear: null,
    atlasNote: 'The map data has no record of NXIVM, and none would fit: it was a commercial self-improvement company, not a religion. It is here because the questions about high-control groups apply to groups of any kind.',
    what: 'Founded near Albany, New York, in 1998 by Keith Raniere and Nancy Salzman; a company that sold self-improvement courses, with a secret women-only group, DOS, inside its circle',
    founded: { y: '1998', t: 'In 1998 Keith Raniere and Nancy Salzman founded NXIVM, a personal-development company based in the Capital District of New York, whose oldest programme was Executive Success Programs.', g: 'reported', s: ['tu2012', 'nyt2017'], r: 'ok', fx: 1 },
    founder: 'Keith Raniere (born 1960) and Nancy Salzman', where: 'Albany, New York (Clifton Park and Halfmoon), with centres in Canada, Mexico and elsewhere.',
    status: 'ended', now: { t: 'It no longer runs its programmes. Its leader was convicted in 2019 and sentenced to 120 years in 2020 (see Legal outcomes). This card does not follow any successor groups.', g: 'record', s: ['raniere2019', 'tu2012'], r: 'ok' },
    size: [{ t: 'An estimated 16,000 people took its courses over about twenty years; the secret group inside it, which began in 2015, was far smaller.', g: 'reported', s: ['nyt2017', 'tu2012', 'time2019'], r: 'part', fx: 1 }],
    overall: 'courts',
    sure: 'The prosecution, verdict and sentence are court records. The earlier history comes from the trial and from journalists, and the defence’s account is part of the record.',
    self: [
      { t: 'NXIVM sold courses, among them “Executive Success Programs”, taught by a method it called “Rational Inquiry”, that promised personal and professional development, and a 2003 mission statement on its website spoke of “raising human awareness” and “fostering an ethical humanitarianism”.', g: 'own', s: ['nyt2017', 'tu2012', 'time2019'], r: 'ok', fx: 1 },
    ],
    facts: [
      { t: 'In about 2015 Raniere and others founded DOS, a secret women-only group inside NXIVM’s circle. The women were recruited under the description of a sisterhood; they were asked to hand over compromising material (“collateral”), were placed beneath “masters” in a chain, and were branded on the lower body with a symbol that, the prosecution showed, contained Raniere’s initials.', g: 'record', s: ['raniere2019', 'nyt2017'], r: 'part' },
    ],
    legal: [
      { d: '19 June 2019', where: 'Federal court, Brooklyn, New York (Eastern District)', t: 'A jury found Keith Raniere guilty on all seven counts: racketeering, racketeering conspiracy, forced-labour conspiracy, wire-fraud conspiracy, sex trafficking, sex-trafficking conspiracy and attempted sex trafficking.', g: 'record', s: ['raniere2019'], r: 'ok' },
      { d: '27 October 2020', where: 'Federal court, Brooklyn, New York (Eastern District)', t: 'Raniere was sentenced to 120 years in prison, and fined $1.75 million, by Judge Nicholas G. Garaufis. He appealed, and the court of appeals is reported to have upheld the conviction and sentence on 9 December 2022; this card has not read the appeal court’s own opinion.', g: 'record', s: ['raniere2019'], r: 'ok', fx: 1 },
      { d: '2019–2021', where: 'Federal court, Brooklyn, New York (Eastern District)', t: 'Others pleaded guilty before the trial: Nancy Salzman (racketeering conspiracy; sentenced to 42 months), Allison Mack (racketeering and racketeering conspiracy; sentenced to three years) and Clare Bronfman (conspiracy to conceal and harbour illegal immigrants for financial gain, and fraudulent use of identification; sentenced to six years and nine months).', g: 'record', s: ['raniere2019'], r: 'ok', fx: 1 },
    ],
    response: [
      { t: 'Raniere’s defence argued at trial that the sexual relationships were consensual, that the women were adults who could leave, and that DOS was a voluntary group. His supporters say the conviction was unjust.', g: 'own', s: ['raniere2019', 'nyt2017'], r: 'part' },
    ],
    harm: [
      { type: 'sexual', t: 'The sex-trafficking convictions rest on evidence that women in DOS were made to have sex with Raniere through fraud and coercion, including the threat to release the “collateral” each had given.', g: 'record', s: ['raniere2019'], r: 'part' },
      { type: 'labour', t: 'The verdict included a forced-labour conspiracy conviction, concerning the work required of women under his control.', g: 'record', s: ['raniere2019'], r: 'ok' },
      { type: 'financial', t: 'The verdict also included wire-fraud conspiracy.', g: 'record', s: ['raniere2019'], r: 'ok' },
    ],
    texts: [
      { title: 'The “Rational Inquiry” and “Executive Success Programs” course materials', year: '1998–2018', by: 'Keith Raniere and Nancy Salzman', publisher: 'The company (proprietary course materials)', rights: 'Proprietary; not published as books; not reproduced here', here: false },
    ],
    books: [], further: ['nyt2017', 'tu2012', 'raniere2019'],
    care: 'The women in DOS were victims of crimes proved at trial, and many were harmed after joining a group that had been presented as personal growth. Many ordinary students took NXIVM’s courses without knowing of DOS. This card gives the court’s findings and the defence’s case beside them.',
    review: 'unchecked' },

  { id: 'family_international', name: 'The Family International (formerly the Children of God)', also: 'Children of God; Family of Love; The Family', atlas: 'family_international', atlasNear: null, atlasNote: '',
    what: 'Founded in Huntington Beach, California, in 1968 by David Berg; a Christian movement of the Jesus-movement era, whose members saw its founder as a prophet',
    founded: { y: '1968', t: 'David Berg began preaching to young people in Huntington Beach, California, in 1968. The movement was called Teens for Christ, then the Children of God, the Family of Love, the Family and, since 2004, the Family International.', g: 'reported', s: ['palmer1999', 'melton'], r: 'ok' },
    founder: 'David Brandt Berg (1919–1994), known to members as Moses David and “Father David”', where: 'California, then communal homes in dozens of countries.',
    status: 'changed', now: { t: 'Active, in changed form: its own site describes it as “an online Christian network of individuals in 75 countries”. The group says that around 2010 it ended its communal “Homes” for most members and became a membership church, and that it has reformed in other ways. Berg died in 1994.', g: 'own', s: ['tfi_site', 'palmer1999'], r: 'part', fx: 1 },
    size: [{ t: 'The group itself said in 1993 that it had about 9,000 members worldwide, about 750 of them in the United States; the BBC reported about 10,000 full-time members in the 1970s. The group’s recent figures are lower and have not been independently checked.', g: 'reported', s: ['palmer1999', 'melton'], r: 'part', fx: 1 }],
    overall: 'reported',
    sure: 'One court finding (1995) is the firmest ground. The rest comes from scholars and from former members, above all those who grew up in the group, and the group says it has since reformed. The group and former members give different dates for its reforms.',
    self: [
      { t: 'Berg taught that members should live together, leave “the System” (the ordinary world), win converts and prepare for the end of the world. His “Mo Letters”, thousands of them, are the movement’s teaching.', g: 'own', s: ['tfi_site', 'palmer1999'], r: 'ok' },
      { t: 'Berg taught that sex between consenting people was an expression of Christian love (“the Law of Love”). From around 1974 to 1987 women in the group were told to offer sex as a way of drawing people in, a practice called “flirty fishing”. It was abandoned in 1987, reportedly because of the spread of AIDS.', g: 'own', s: ['palmer1999', 'melton'], r: 'part', fx: 1 },
    ],
    facts: [
      { t: 'The group’s “flirty fishing” (1974–1987) and its teaching on sex are documented in its own writings and in scholarship.', g: 'reported', s: ['palmer1999', 'melton'], r: 'ok' },
    ],
    legal: [
      { d: '1995', where: 'High Court of Justice, Family Division, London', t: 'In a custody case concerning children of members, Lord Justice Ward ruled that the group had in the past engaged in abusive sexual practices involving minors and that Berg’s writings had encouraged them; he also found that by 1995 the Family had taken stringent measures to end such practices and provided a safe environment for children.', g: 'record', s: ['ward1995'], r: 'ok', fx: 1 },
    ],
    response: [
      { t: 'The Family says it has reformed: that it now forbids sexual contact between adults and minors and that “flirty fishing” ended in 1987. Former members give later dates for some of these changes.', g: 'own', s: ['tfi_site', 'palmer1999'], r: 'part' },
    ],
    harm: [
      { type: 'sexual', t: 'Court finding (1995): sexual abuse of children and young people took place in the group in the past, and Berg’s teaching encouraged it. The court also found that by then the group had ended these practices.', g: 'record', s: ['ward1995'], r: 'ok', fx: 1 },
      { type: 'children', t: 'Former members who grew up in the group, now adults, describe beatings, long separation from their parents (children were often raised in group homes), poor schooling and sexual abuse. Scholars of the group’s children record these accounts.', g: 'testimony', by: 'former members who grew up in the group', s: ['palmer1999', 'davis1984'], r: 'part' },
      { type: 'family', t: 'Adult former members describe leaving jobs, homes and families to join, and being moved between countries and homes at the leaders’ direction.', g: 'testimony', by: 'adult former members', s: ['palmer1999', 'williams1998'], r: 'part' },
    ],
    texts: [
      { title: 'The Mo Letters', year: '1970–1994', by: 'David Berg', publisher: 'The group (circulated in print and later on its own sites)', rights: 'Held by the group; not reproduced here', here: false, note: 'The Text catalogue has a record of them.' },
    ],
    books: [], further: ['palmer1999', 'melton', 'davis1984', 'williams1998', 'tfi_site'],
    care: 'Many of those who grew up in the group are adults now, and what they have said is part of the record; many ordinary members joined to serve. This card gives the court finding and the group’s reply together. Understood, not endorsed.',
    review: 'unchecked' },

  { id: 'rajneesh', name: 'The Rajneesh movement (Osho)', also: 'Rajneeshism; Osho International; Rajneeshpuram, its Oregon city', atlas: 'rajneesh', atlasNear: null, atlasNote: '',
    what: 'Founded in Bombay in 1970 by Bhagwan Shree Rajneesh (later called Osho); a meditation movement around an Indian spiritual teacher',
    founded: { y: '1970', t: 'Chandra Mohan Jain, a former lecturer in philosophy, led meditation camps from 1962; in 1970 he was in Bombay initiating followers, and in 1974 his ashram in Pune opened. In 1981 the movement moved to a ranch in Wasco County, Oregon, where it built the city of Rajneeshpuram (incorporated in May 1982); the commune disbanded in 1985.', g: 'reported', s: ['carter1990', 'fitzgerald1986'], r: 'ok', fx: 1 },
    founder: 'Bhagwan Shree Rajneesh, later called Osho (1931–1990)', where: 'Bombay and Pune, India; Rajneeshpuram, Wasco County, Oregon (1981–1985); centres in Europe and elsewhere.',
    status: 'changed', now: { t: 'The Oregon community ended in 1985. The movement continues, centred on the Osho International Meditation Resort in Pune, India.', g: 'own', s: ['osho_site', 'carter1990'], r: 'ok' },
    size: [{ t: 'Estimates of Rajneeshpuram’s size at its peak in the mid-1980s run from a few thousand residents (one archive says that by 1982 it could sustain 2,000 residents and as many as 5,000 visitors) to as many as 7,000 people. There is no reliable count of followers since.', g: 'reported', s: ['carter1990', 'fitzgerald1986'], r: 'part', fx: 1 }],
    overall: 'courts',
    sure: 'The poisonings, the pleas and Rajneesh’s departure from the United States are in court records and a public-health study. What Rajneesh knew of the crimes was not decided in court. The movement’s teaching, apart from Oregon, is for the scholars and the movement to describe.',
    self: [
      { t: 'Rajneesh taught meditation, including “Dynamic Meditation” (an active form with breathing and release) and a free attitude to sex. Followers, called “sannyasins”, wore orange or red clothes and took new names.', g: 'own', s: ['osho_site', 'carter1990'], r: 'ok' },
    ],
    facts: [
      { t: 'In 1981 followers bought a ranch in Wasco County, Oregon, and built a town on it, Rajneeshpuram, with conflicts with neighbours and the state over land-use law. In 1984 the leadership brought thousands of homeless people to Oregon and registered them as voters for the November county election; many were later left on the streets.', g: 'reported', s: ['fitzgerald1986', 'carter1990'], r: 'part' },
    ],
    legal: [
      { d: 'September 1984', where: 'The Dalles, Oregon', t: 'Salmonella poisoning. Members of the leadership contaminated salad bars in ten restaurants in The Dalles. 751 people fell ill and 45 were hospitalised; no one died. A public-health study published in JAMA in 1997 traced the outbreak to the group, whose leaders had meant to keep voters from the polls in a county election.', g: 'record', s: ['torok1997', 'sheela1986'], r: 'part' },
      { d: '1986', where: 'Federal court, Portland, Oregon', t: 'On 22 July 1986 Ma Anand Sheela, the movement’s chief administrator, and another leader entered Alford pleas (pleas that do not admit guilt) to charges that included the poisoning plot, an attempted murder and wiretapping. Sheela served 29 months of her sentence, which one reference gives as 20-year terms reduced to four and a half years, and has lived in Switzerland since.', g: 'record', s: ['sheela1986', 'fitzgerald1986'], r: 'part', fx: 1 },
      { d: 'November 1985', where: 'Federal court, Portland, Oregon', t: 'On 8 November 1985 Rajneesh pleaded not guilty to the immigration charges against him, and later entered an Alford plea to two counts. He received a ten-year suspended sentence, five years’ probation and a $400,000 penalty in fines and prosecution costs, and agreed to leave the United States. He was never prosecuted for the poisoning or the other violence.', g: 'record', s: ['rajneesh1985'], r: 'ok', fx: 1 },
    ],
    response: [
      { t: 'Rajneesh said in September 1985 that the leaders around Sheela had acted without his knowledge. The movement’s centre in Pune today presents his teaching as meditation and offers courses to visitors from many countries.', g: 'own', s: ['fitzgerald1986', 'osho_site'], r: 'ok' },
    ],
    harm: [
      { type: 'violence', t: 'In September 1984 the leadership deliberately poisoned 751 people in The Dalles, Oregon; none died, and 45 were hospitalised (see Legal outcomes).', g: 'record', s: ['torok1997', 'sheela1986'], r: 'ok' },
      { type: 'violence', t: 'The leaders’ pleas also covered an attempted murder and wiretapping.', g: 'record', s: ['sheela1986'], r: 'part', fx: 1 },
    ],
    texts: [
      { title: 'Discourses of Osho, including The Book of Secrets', year: '1972–1990', by: 'Osho (Bhagwan Shree Rajneesh)', publisher: 'Osho International Foundation and other publishers', rights: 'In copyright and trademark; held by the foundation', here: false, note: 'The Text catalogue has a record of them.' },
      { title: 'Rajneeshism: An Introduction', year: '1983', by: 'The Rajneesh Foundation', publisher: 'Rajneesh Foundation International', rights: 'Rights not checked; not reproduced here', here: false, note: 'The Text catalogue has a record of it.' },
    ],
    books: ['x-yog'], further: ['carter1990', 'fitzgerald1986', 'torok1997', 'osho_site'],
    care: 'Many people came to the movement for meditation and had nothing to do with what happened in Oregon, and many still practise. The crimes were the leadership’s, and Rajneesh himself was convicted of immigration fraud, not of them.',
    review: 'unchecked' },

  { id: 'unification_church', name: 'The Unification Church (Family Federation for World Peace and Unification)', also: 'Holy Spirit Association for the Unification of World Christianity', atlas: 'unification_church', atlasNear: null, atlasNote: '',
    what: 'Founded in Seoul in 1954 by Sun Myung Moon as the Holy Spirit Association for the Unification of World Christianity; it has critics and defenders, and the card sets out both',
    founded: { y: '1954', t: 'Sun Myung Moon founded the Holy Spirit Association for the Unification of World Christianity in Seoul on 1 May 1954. It reached the United States from 1959.', g: 'reported', s: ['barker1984', 'melton'], r: 'part' },
    founder: 'Sun Myung Moon (1920–2012), with his wife Hak Ja Han Moon', where: 'Seoul, South Korea; present in many countries, with large holdings in Korea, Japan and the United States.',
    status: 'changed', now: { t: 'Active. It has divided since Moon’s death in 2012, the largest part being led by his widow, Hak Ja Han Moon. Its Japanese branch was ordered dissolved by a court in 2025, and the order was upheld on appeal in 2026 (see Legal outcomes).', g: 'reported', s: ['kyodo2025', 'melton'], r: 'part', fx: 1 },
    size: [{ t: 'The church has claimed millions of members worldwide; independent estimates are far lower and differ by country.', g: 'reported', s: ['barker1984', 'melton'], r: 'part' }],
    overall: 'contested',
    sure: 'This is the most contested entry. Court records show real events (the founder’s conviction, a Japanese court’s order against the church there), and scholars disagree sharply about whether its recruiting and its marriages amount to coercion. The evidence is mixed, so the card gives both sides.',
    self: [
      { t: 'The church teaches, in the Divine Principle, that God’s plan for humanity was spoiled by the Fall and that Jesus’s mission was left incomplete; it holds that Moon and his wife are the “True Parents” who complete it, and that marriage blessed by them removes the stain of the Fall. It holds mass “Blessing” weddings.', g: 'own', s: ['familyfed', 'barker1984'], r: 'ok' },
      { t: 'It describes itself as a Christian-rooted movement for family and world peace, and it sponsors many causes and organisations.', g: 'own', s: ['familyfed'], r: 'ok' },
    ],
    facts: [
      { t: 'In Barker’s seven-year study of members in Britain and the United States (1984), many of the people who went to the movement’s recruitment meetings did not become members, and members left of their own accord, which she took as evidence against the idea that the group simply overpowered recruits.', g: 'reported', s: ['barker1984', 'bromley1981'], r: 'ok', fx: 1 },
      { t: 'Many scholars (Barker, Bromley and Shupe among them) reject the idea that “brainwashing” explains why people join new religions; others still argue that coercive influence is real in some groups. The word is used here only in quotation.', g: 'reported', s: ['barker1984', 'bromley1981'], r: 'part' },
      { t: 'Former members and some parents have said that it used deception and heavy pressure to recruit.', g: 'alleged', by: 'former members and some parents, as reported by Barker and by Bromley and Shupe', s: ['barker1984', 'bromley1981'], r: 'part' },
    ],
    legal: [
      { d: '1982–1983', where: 'Federal court, New York', t: 'Sun Myung Moon was convicted by a jury on 18 May 1982 of filing false tax returns for 1973 to 1975 and of conspiracy, and was sentenced to 18 months in prison and a $25,000 fine; he served 13 months at the Danbury federal prison. The Court of Appeals upheld the convictions on 13 September 1983. Many religious bodies and civil-liberties groups filed briefs on his side.', g: 'record', s: ['moon1983'], r: 'ok', fx: 1 },
      { d: '31 October 1978', where: 'United States House of Representatives', t: 'A House subcommittee’s report on Korean–American relations (the Fraser report) examined the movement’s activities in the United States, including its relations with South Korean officials.', g: 'record', s: ['fraser1978'], r: 'ok' },
      { d: '25 March 2025', where: 'Tokyo District Court', t: 'After the assassination of former prime minister Shinzo Abe in July 2022, whose killer said he held a grudge against the church over his mother’s donations, the Japanese government investigated and, in October 2023, asked the Tokyo District Court to dissolve the church’s Japanese religious corporation. The court ordered its dissolution on 25 March 2025, on the ministry’s ground that the church had deviated from legitimate religious practices. The church appealed; the Tokyo High Court upheld the order on 4 March 2026, and the Supreme Court of Japan upheld it on 22 June 2026; this card has not read the courts’ own texts.', g: 'record', s: ['tokyo2025', 'kyodo2025'], r: 'part', fx: 1 },
    ],
    response: [
      { t: 'The church and many religious and civil-liberties groups said the 1982 case against Moon was a threat to religious freedom.', g: 'own', s: ['moon1983', 'familyfed'], r: 'part' },
      { t: 'The church says its members give freely, that the dissolution order wrongly punishes a whole religious body for the acts of some individuals, and that it is appealing.', g: 'own', s: ['kyodo2025', 'familyfed'], r: 'part' },
    ],
    harm: [
      { type: 'financial', t: 'The Tokyo court’s 2025 finding concerns the solicitation of large donations from followers in Japan, which the court found illegal and harmful (see Legal outcomes).', g: 'record', s: ['tokyo2025', 'kyodo2025', 'asianews2025'], r: 'ok' },
    ],
    harmNote: 'Whether its recruiting and its arranged marriages amount to coercion, as opposed to strong persuasion, is the point on which scholars, courts and former members differ. This card does not settle it.',
    texts: [
      { title: 'Exposition of the Divine Principle', year: '1966 (Korean); English edition 1973', by: 'Sun Myung Moon and the church', publisher: 'The church (various editions)', rights: 'In copyright; not reproduced here', here: false, note: 'The Text catalogue has a record of it.' },
      { title: 'Cheon Seong Gyeong', year: '2005–2014', by: 'Sun Myung Moon', publisher: 'The church (Korean)', rights: 'In copyright; not reproduced here', here: false, note: 'The Text catalogue has a record of it.' },
    ],
    books: [], further: ['barker1984', 'bromley1981', 'moon1983', 'familyfed'],
    care: 'The church has real critics and real defenders, and members include people born into it; both are heard here. The word “brainwashing” is used only in quotation, because scholars do not agree that it explains membership. Understood, not endorsed.',
    review: 'unchecked' },

  { id: 'raelism', name: 'Raëlism (the Raëlian Movement)', also: 'The International Raëlian Movement; Clonaid, a company linked to it', atlas: 'raelism', atlasNear: null, atlasNote: '',
    what: 'Founded in France in 1974 by Claude Vorilhon, who took the name Raël; it teaches that humankind was made by people from another world (the account is Raël’s own), and the card sets out its critics and its reply',
    founded: { y: '1974', t: 'The movement began in France in the 1970s. Claude Vorilhon (born 1946), who took the name Raël, published The Book Which Tells the Truth in 1974; MADECH, its first organisation, was launched in December 1974, and the Raëlian Movement began in February 1976. The meeting that he says began it was on 13 December 1973 at the Puy de Lassolas crater near Clermont-Ferrand (one article gives 3 December); that is his own account.', g: 'reported', s: ['palmer2004', 'melton'], r: 'ok', fx: 1 },
    founder: 'Claude Vorilhon, who took the name Raël (born 1946)', where: 'France, then Canada; members in many countries.',
    status: 'active', now: { t: 'Active. The movement claims tens of thousands of members, most of them in French-speaking Western Europe, North America and parts of East Asia.', g: 'reported', s: ['palmer2004', 'melton'], r: 'ok', fx: 1 },
    size: [
      { t: 'The movement says it has tens of thousands of members in many countries.', g: 'own', s: ['rael_site'], r: 'ok' },
      { t: 'No independent count exists, and scholars treat the movement’s figures with caution.', g: 'reported', s: ['palmer2004', 'melton'], r: 'part' },
    ],
    overall: 'contested',
    sure: 'The beliefs and the 2002 cloning announcement are well documented. This card cites no court judgment or official inquiry that found the movement harmful to its members, and says so. It is on this page because the movement is often called a “cult” in the press, which the card does not take as evidence of anything.',
    self: [
      { t: 'Raëlians teach that human beings were made in laboratories by people from another world, whom Raël calls the Elohim (the Hebrew word translated “God”, which they read as a plural); that Jesus, Buddha and Muhammad were their messengers; and that humanity can be given eternal life by cloning.', g: 'own', s: ['rael_site', 'palmer2004'], r: 'ok' },
      { t: 'They practise “sensual meditation”, hold open attitudes to sex, and want an embassy built to welcome the Elohim.', g: 'own', s: ['rael_site', 'palmer2004'], r: 'ok' },
    ],
    facts: [
      { t: 'In December 2002 Clonaid, a company founded by Raël and linked to the movement, announced the birth of the first cloned human baby. No evidence for the claim has ever been published, and scientists and journalists who asked for proof did not receive it.', g: 'reported', s: ['clonaid2002', 'palmer2004'], r: 'ok' },
    ],
    legal: [],
    legalNote: 'This card cites no court judgment or official inquiry about the movement.',
    response: [],
    harm: [],
    harmNote: 'This card cites no court judgment or official inquiry that found the movement harmful to its members. Critics have mostly attacked it for its beliefs and its claims (the cloning announcement above, and its views on sex), and the movement rejects the criticism. The 2002 announcement is an unproven claim, not a documented harm.',
    texts: [
      { title: 'The Book Which Tells the Truth (Le Livre qui dit la vérité)', year: '1974', by: 'Raël (Claude Vorilhon)', publisher: 'The movement (the Raëlian foundation)', rights: 'In copyright; the movement offers some of its books to read free on its own site (not copied here)', here: false, note: 'The Text catalogue has a record of it.' },
    ],
    books: ['b-gen'], further: ['palmer2004', 'melton', 'rael_site'],
    care: 'The movement’s members are ordinary people with an unusual belief. The Genesis text beside this card is the one the Raëlians reread: they take its plural “Elohim” to mean a people, where most readers take it as a name for God. Understood, not endorsed.',
    review: 'unchecked' },

  { id: 'twelve_tribes', name: 'The Twelve Tribes', also: 'Twelve Tribes communities; Messianic Communities; Northeast Kingdom Community Church (its first name in Vermont)', atlas: null, atlasNear: 'evangelicalism', atlasNearName: 'Evangelicalism',
    atlasNote: 'The map data has no record of the Twelve Tribes. It grew out of the Jesus movement among evangelical Christians, so the nearest religion on the map is Evangelicalism.',
    what: 'Founded in Chattanooga, Tennessee, in 1972 by Gene Spriggs; a communal Christian movement of the Jesus-movement era',
    founded: { y: '1972', t: 'Gene Spriggs and his wife began a Bible-study community in Chattanooga, Tennessee, in 1972. The movement settled at Island Pond, Vermont, in the late 1970s and has since spread to many countries.', g: 'reported', s: ['melton', 'nyt1984'], r: 'ok' },
    founder: 'Gene Spriggs (Elbert Eugene Spriggs)', where: 'Chattanooga, Tennessee; Island Pond, Vermont; communities in the United States, Canada, Europe, Australia, South America and elsewhere.',
    status: 'active', now: { t: 'Active. Its own site lists 46 communities in 11 countries, in North America, South America, Europe, Australia and Japan.', g: 'own', s: ['twelve_site'], r: 'ok', fx: 1 },
    size: [{ t: 'The group says several thousand people live in its communities.', g: 'own', s: ['twelve_site'], r: 'nf' }],
    overall: 'reported',
    sure: 'The 1984 raid is documented, and so is the dismissal of the cases that followed. The 2013 removal of children in Bavaria was reported by several outlets; what became of the children and the European Court’s decision of 2018 are given on one reference page only. How the group disciplines children rests on its own statements and on former members and an undercover report; the group says it is loving and religious.',
    self: [
      { t: 'The Twelve Tribes describe themselves as a community of followers of Yahshua (their name for Jesus), living together in the pattern of the first Christians, sharing goods, running businesses (farms, workshops and the “Yellow Deli” restaurants are theirs) and waiting for Christ’s return.', g: 'own', s: ['twelve_site', 'melton'], r: 'ok' },
      { t: 'The group teaches that parents must discipline children firmly, with a thin rod, as it reads the Bible to say, and that this is loving and not abuse.', g: 'own', s: ['twelve_site'], r: 'ok' },
    ],
    facts: [
      { t: 'On 5 September 2013 German police raided two of the group’s communities in Bavaria and removed about 40 children, after an undercover reporter secretly recorded children being beaten with rods. Some of the children were later returned to their parents and some were not; in 2018 the European Court of Human Rights upheld the German authorities’ action.', g: 'reported', s: ['ap2013', 'spiegel2013'], r: 'ok', fx: 1 },
    ],
    legal: [
      { d: '22–23 June 1984', where: 'Island Pond, Vermont', t: 'In the early morning of 22 June 1984 Vermont state police and social workers raided the community at Island Pond and took 112 children into custody on suspicion of child abuse. The cases were dismissed after a judge found that the search warrant was unconstitutional; a district court had ordered the children returned to their parents the next day.', g: 'record', s: ['vt1984', 'nyt1984'], r: 'part', fx: 1 },
    ],
    response: [
      { t: 'The group says the 1984 raid showed that the allegations were false, that its way of disciplining children is religious and loving, and that it is a peaceful community whose members stay by choice.', g: 'own', s: ['twelve_site'], r: 'part' },
    ],
    harm: [
      { type: 'children', t: 'Former members, and the undercover reporter whose 2013 film prompted the removals in Germany, allege that children in the communities were beaten with rods beyond ordinary discipline. The group denies abuse.', g: 'alleged', by: 'former members and an undercover television reporter (2013)', s: ['ap2013', 'spiegel2013'], r: 'ok' },
    ],
    harmNote: 'In 1984 the cases against the group were dismissed; the 2013 removal in Bavaria ended with some children returned and, according to one reference page, with the European Court of Human Rights upholding the German action in 2018 (that court’s text was not read). This card cannot tell whether the discipline described crosses the line from strict to abusive: the sources allege it and the group denies it.',
    texts: [
      { title: 'Teachings, tapes and pamphlets of the communities', year: '1972–', by: 'The communities', publisher: 'The group’s own sites and publications', rights: 'Held by the group; not reproduced here', here: false },
    ],
    books: ['n-act'], further: ['melton', 'nyt1984', 'twelve_site'],
    care: 'Members are families, and many were born in the communities. Children are the main concern in the record, and the sources about their treatment are partial: the group’s own and former members’. The card says which is which.',
    review: 'unchecked' },

  { id: 'flds', name: 'The Fundamentalist Church of Jesus Christ of Latter-Day Saints (FLDS)', also: 'Mormon fundamentalism (the wider movement); the Short Creek community', atlas: 'fundamentalist_lds', atlasNear: null,
    atlasNote: 'The map data’s record “Mormon fundamentalism” covers the whole movement, of which the FLDS is the best known part.',
    what: 'Grew from Short Creek families on the Utah–Arizona border in the 1930s; a Mormon-fundamentalist church that practises plural marriage',
    founded: { y: '1930s', t: 'The Church of Jesus Christ of Latter-day Saints ended new plural marriages (the Manifesto of 1890) and excommunicated those who kept them, and small groups continued the practice. A community of such families settled at Short Creek, on the Utah–Arizona border (now Hildale, Utah, and Colorado City, Arizona), in the 1930s, and an Arizona raid in 1953 failed to break it up. Warren Jeffs became the church’s president in 2002, after the death of his father, Rulon Jeffs.', g: 'reported', s: ['bradley1993', 'hales2006'], r: 'part' },
    founder: 'No single founder; the community grew from Short Creek families of the 1930s. Its presidents have included Leroy Johnson, Rulon Jeffs and, from 2002, Warren Jeffs.', where: 'Hildale, Utah, and Colorado City, Arizona (Short Creek); the YFZ Ranch near Eldorado, Texas (2004–2008); other communities in the western United States and Canada.',
    status: 'changed', now: { t: 'Active in smaller communities. Its president since 2002, Warren Jeffs, is serving a life sentence in Texas (see Legal outcomes).', g: 'record', s: ['jeffs2011'], r: 'ok' },
    size: [{ t: 'There is no reliable count. Estimates in the 2000s ran to thousands: a census of fundamentalist Mormon groups in 2007 put the FLDS Church at about 8,000, down from an estimate of about 10,000 a few years earlier, and its compiler said that these were only estimates. Hildale and Colorado City hold the largest concentration of members.', g: 'reported', s: ['hales2006', 'krakauer2003', 'deseret2007'], r: 'ok', fx: 1 }],
    overall: 'courts',
    sure: 'Jeffs’s convictions and the Texas court’s ruling on the 2008 raid are court records. Claims about expulsions and arranged marriages beyond the convictions rest on former members and journalists, and the church disputes them.',
    self: [
      { t: 'The FLDS teaches that plural marriage (a man with more than one wife) is required for the highest place in heaven; that a single prophet, its president, receives God’s will for the community and assigns marriages; and that its people should keep apart from the outside world, in plain clothing (long dresses for women and girls) and without television or the internet.', g: 'own', s: ['hales2006', 'bennion1998'], r: 'part' },
    ],
    facts: [
      { t: 'The Latter-day Saints’ church disowns the practice and excommunicates its members who take part in it; the FLDS and the LDS church are separate bodies.', g: 'reported', s: ['hales2006', 'bradley1993'], r: 'ok' },
    ],
    legal: [
      { d: 'September 2007 – July 2010', where: 'Utah', t: 'Warren Jeffs was convicted in September 2007 of two counts of rape as an accomplice, for arranging the marriage of a 14-year-old girl to her 19-year-old cousin in 2001, and sentenced to two consecutive terms of five years to life. The Utah Supreme Court reversed the convictions on 27 July 2010 because the consent instructions given to the jury were erroneous.', g: 'record', s: ['jeffs2010'], r: 'ok', fx: 1 },
      { d: '4 and 9 August 2011', where: 'Tom Green County, Texas', t: 'In Texas, Jeffs was convicted of aggravated sexual assault of a child (a girl of 12) and sexual assault of a child (a girl of 15), both of whom he had taken as wives, and was sentenced to life in prison plus 20 years.', g: 'record', s: ['jeffs2011'], r: 'part' },
      { d: 'April–June 2008', where: 'Texas', t: 'In April 2008 the state of Texas took children into care from the church’s YFZ Ranch near Eldorado (the Supreme Court of Texas gives the number as 468; other accounts give 416, 439 or 462), after a call (later found to be a hoax) said that a girl there was being abused. On 29 May 2008 the Supreme Court of Texas held that, on the record before it, removal of the children was not warranted, and the children were ordered returned to their families.', g: 'record', s: ['txdfps2008'], r: 'ok', fx: 1 },
    ],
    response: [
      { t: 'FLDS members said at the time that the 2008 removal of children was religious persecution, and that families were being punished for their beliefs.', g: 'own', s: ['txdfps2008'], r: 'ok' },
    ],
    harm: [
      { type: 'sexual', t: 'Warren Jeffs’s Texas convictions concerned two girls, aged 12 and 15, whom he had taken as wives. His Utah conviction of 2007, since reversed, concerned a marriage he arranged for a 14-year-old girl to her 19-year-old cousin.', g: 'record', s: ['jeffs2011', 'jeffs2010'], r: 'ok' },
      { type: 'family', t: 'Former members and families report that the church expelled men and teenage boys, and reassigned wives and children to other men on the prophet’s order, breaking up families. The church disputes these accounts.', g: 'testimony', by: 'former members and families, as reported by journalists', s: ['bistline2004', 'krakauer2003'], r: 'ok' },
    ],
    texts: [
      { title: 'The Book of Mormon, the Pearl of Great Price and the Doctrine and Covenants', year: '1830–1876', by: 'Joseph Smith and others', publisher: 'Many editions', rights: 'The old editions are in the public domain', here: true, lib: ['x-bom', 'x-pgp'], note: 'The Library holds the 1830 Book of Mormon and the 1902 Pearl of Great Price. The Doctrine and Covenants, whose section 132 is the church’s warrant for plural marriage, is not yet in the Library.' },
      { title: 'Sermons and letters of the church’s presidents, including Warren Jeffs', year: '1986–2011', by: 'The church’s presidents', publisher: 'Held by the church; some entered in evidence in court', rights: 'Not reproduced here', here: false },
    ],
    books: ['x-bom', 'x-pgp'], further: ['hales2006', 'bradley1993', 'bennion1998', 'krakauer2003'],
    care: 'Women and children in these communities are not criminals, and many people have left on their own. Warren Jeffs is a living person convicted in court, and this card says only what the court records and the sources document. The Latter-day Saints’ church disowns the practice.',
    review: 'unchecked' },
];

/* groups in the Atlas (or not in it) that are not yet written up, and why: shown at the foot of the page so that nothing is silently left out */
/* The same template for every entry (alpha audit AA-08, AA-09, 21 November 2026): the group’s founding, which is a matter of record, then what is on the public record or claimed, and by whom. No verdict in the tool’s own voice, and no note about the work
   in the lines themselves: the page says once, above the list, that these are not yet written up because their sources have not been read. Each line was read again on 22 November 2026 against the English Wikipedia pages on the group (Shincheonji Church of Jesus,
   Eastern Lightning, Falun Gong and Persecution of Falun Gong, Jehovah’s Witnesses, ISKCON, Church Universal and Triumphant, Synanon); `r` says what that reading found ('ok' everything, 'part' something that was not in the page read), `unf` says what the page read did not mention (the page prints it as “The page read did not mention: …. The line above stays as written.”), `fx` that the line was corrected.
   Who reports what for Falun Gong: Amnesty International, the UN Special Rapporteur on Torture, Julia Ching (Persecution of Falun Gong). */
const MOV_PENDING = [
  { name: 'Shincheonji Church of Jesus', atlas: 'shincheonji', why: 'Founded in South Korea by Lee Man-hee in 1984. The 2020 coronavirus outbreak in South Korea and the court proceedings that followed are on the public record.', r: 'ok' },
  { name: 'Church of Almighty God (Eastern Lightning)', atlas: 'church_almighty_god', why: 'Established in China in 1991. The Chinese government’s accusations against it and the church’s denial are both public, and the label “xie jiao” is part of what is contested.', r: 'ok' },
  { name: 'Falun Gong', atlas: 'falun_gong', why: 'Founded in China by Li Hongzhi in the early 1990s and banned there in July 1999; in October 1999 the authorities classed it as a “xie jiao” (“heterodox teaching”, rendered in English as “evil cult”), the Supreme People’s Court issuing a judicial interpretation to that effect. Amnesty International and United Nations experts report arrests and torture of practitioners, and the Chinese government has denied some of these reports; the scholar Julia Ching has written that the label was set on political grounds, not by a religious authority.', r: 'ok', fx: 1 },
  { name: 'Jehovah’s Witnesses', atlas: 'jehovahs_witnesses', why: 'Grew from the Bible Student movement founded by Charles Taze Russell in the nineteenth century, and took the name Jehovah’s witnesses in 1931. In July and August 2015 an Australian royal commission held a public hearing on how the organisation handled allegations of child sexual abuse; its report of November 2016 said that the organisation had recorded allegations of child sexual abuse against 1,006 of its members, in files going back to 1950. The practice of shunning people who leave was questioned at a further hearing of the commission in 2017, where the organisation’s representatives said that it rests on their understanding of scripture.', r: 'ok', fx: 1 },
  { name: 'ISKCON (the Hare Krishna movement)', atlas: 'iskcon', why: 'Founded in New York in 1966 by A. C. Bhaktivedanta Swami Prabhupada. In 1998 the movement itself published a report on the abuse of children in its boarding schools in the 1970s and 1980s, and in 2000 former students sued it; both are on the public record.', r: 'ok', fx: 1 },
  { name: 'Church Universal and Triumphant', atlas: 'summit_lighthouse', why: 'Grew from the Summit Lighthouse, founded in the United States by Mark L. Prophet in 1958, and was led after his death in 1973 by Elizabeth Clare Prophet; one encyclopedia page dates the church itself to 1975. It built underground shelters in Montana from 1986, and in March 1990 around 7,000 members took shelter after its leader had warned of a coming nuclear war; her children say that she named April 1990, and the church says that her warnings carried no fixed date. In 1989 a senior member was arrested in Spokane, Washington, while buying weapons under a false name, and another senior member later admitted involvement and received a short prison sentence.', r: 'ok', fx: 1 },
  { name: 'Synanon', atlas: null, why: 'Founded in Santa Monica, California, in 1958 by Charles Dederich as a drug-rehabilitation programme. Its board approved calling it a religion in 1974, and its articles of incorporation were amended in September 1975 to add “religious purposes”; a United States court later heard its tax case as Synanon Church v. United States. The map data has no record of it.', r: 'ok', fx: 1 },
];

const MOV_BY_ID = Object.setPrototypeOf(Object.fromEntries(MOVEMENTS.map((m) => [m.id, m])), null);
[MOV_GRADES, MOV_SRC_KINDS, MOV_HARM, MOV_STATUS, MOV_OVERALL, MOV_REVIEW, MOV_SOURCES, MOV_READ, MOV_READ.marks].forEach((o) => Object.setPrototypeOf(o, null));

/* every claim of an entry, in the order the card shows them (the founding, the present, the size, then each part) */
const movClaims = (m) => [m.founded, m.now, ...m.size, ...m.self, ...m.facts, ...m.legal, ...m.response, ...m.harm];
/* the source ids of an entry in the order they are first used, then the ones only listed under “where to look further” */
function movSourceIds(m) {
  const out = []; const add = (id) => { if (!out.includes(id)) out.push(id); };
  movClaims(m).forEach((c) => (c.s || []).forEach(add)); (m.further || []).forEach(add); return out;
}
/* how far the first reading got on one entry, counted from its claims (the page prints these numbers; tests/movements.test.js holds them) */
const movReadCounts = (m) => { const cl = movClaims(m); const n = (f) => cl.filter(f).length; return { total: cl.length, ok: n((c) => c.r === 'ok'), part: n((c) => c.r === 'part'), nf: n((c) => c.r === 'nf'), fx: n((c) => c.r && c.fx), unread: n((c) => !c.r) }; };
const movHarmTypes = (m) => [...new Set(m.harm.map((h) => h.type))];
if (typeof module !== 'undefined' && module.exports) module.exports = { MOVEMENTS, MOV_BY_ID, MOV_GRADES, MOV_SRC_KINDS, MOV_HARM, MOV_STATUS, MOV_OVERALL, MOV_REVIEW, MOV_READ, MOV_SOURCES, MOV_TERM, MOV_ASK, MOV_HELP, MOV_PENDING, movClaims, movReadCounts, movSourceIds, movHarmTypes };
