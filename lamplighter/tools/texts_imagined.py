"""The imagined shelf (Library group 'im'): fiction and poetry of the imagination, kept apart from the sources, the history and the graded pages (the maker's rule, ROADMAP.md: "Fiction is its own shelf,
labelled as imagined, never mixed into a graded page"). Added 16 November 2026 with the maker's approval of each source (Project Gutenberg plain-text files, each fetched once into tools/cache/gutenberg/):
   i-dan  Dante Alighieri, The Divine Comedy (c. 1308-1320), Henry Wadsworth Longfellow's translation (1867), Project Gutenberg #1004 (709,055 bytes)
   i-mil  John Milton, Paradise Lost (1667; the twelve-book arrangement of 1674), Project Gutenberg #26 (491,461 bytes)
   i-bun  John Bunyan, The Pilgrim's Progress, Part One (1678), Project Gutenberg #131 (331,509 bytes)
   i-cth  H. P. Lovecraft, The Call of Cthulhu (Weird Tales, February 1928), Project Gutenberg #68283 (92,370 bytes)
   i-fes  H. P. Lovecraft, The Festival (Weird Tales, January 1925), Project Gutenberg #68553 (40,965 bytes)
   i-dun  H. P. Lovecraft, The Dunwich Horror (Weird Tales, April 1929), Project Gutenberg #50133 (123,217 bytes)
Rights: Longfellow (died 1882), Milton and Bunyan are public domain everywhere. Lovecraft died in 1937, so his tales are public domain in the EU and UK (life + 70 years); the three tales here were all
published before 1930, so they are public domain in the US too (Project Gutenberg's own transcriber's notes add that no renewal of the 1928 and 1929 copyrights was found). Later Lovecraft tales are left out
on purpose: some were first published after 1930 and their US status is less clear.
Each builder returns the same kind of entry as texts_freedom.py: secs=[[heading, text]], by, license, src, verse, note. What is left out of each book is said in its note. Run through build_texts.py
(see the hook there) or on its own, which merges only these ids into texts/index.js:  python3 tools/texts_imagined.py
Downloads are cached in tools/cache/ and parsed only, never executed."""
import re
import build_texts_util as U

PG = U.PG_LICENSE
FICTION = 'Imagined: this is a work of the imagination by a known author, written as literature and never offered as scripture or revelation. It is on the shelf because readers have taken religious meaning from it or built on it, and not as evidence of what anyone believed or did. '
SPECS = {
    'i-dan': (1004, 'Dante Alighieri, The Divine Comedy, translated by Henry Wadsworth Longfellow (1867)'),
    'i-mil': (26, 'John Milton, Paradise Lost (1667; the twelve books of 1674)'),
    'i-bun': (131, 'John Bunyan, The Pilgrim’s Progress, Part One (1678)'),
    'i-cth': (68283, 'H. P. Lovecraft, The Call of Cthulhu (Weird Tales, February 1928)'),
    'i-fes': (68553, 'H. P. Lovecraft, The Festival (Weird Tales, January 1925)'),
    'i-dun': (50133, 'H. P. Lovecraft, The Dunwich Horror (Weird Tales, April 1929)'),
}


def italics(s):
    """Gutenberg's _italic_ marks removed (where they open and close a run, which may run over lines)."""
    return re.sub(r'(?<![A-Za-z0-9])_(?=\S)([^_]{1,800}?)(?<=\S)_(?![A-Za-z0-9])', r'\1', s, flags=re.S)


def verse_lines(text):
    """Verse kept line by line, indentation made one step, blank runs made one."""
    return U.keep_lines(text)


def mixed(text):
    """Prose joined into paragraphs, and a paragraph whose lines are all indented (verse inside a prose book) kept line by line."""
    out = []
    for p in re.split(r'\n[ \t]*\n', text.strip()):
        lines = [l.rstrip() for l in p.split('\n') if l.strip()]
        if not lines: continue
        if len(lines) > 1 and all(l[:1] == ' ' for l in lines): out.append('\n'.join('  ' + l.strip() for l in lines))
        else: out.append(' '.join(l.strip() for l in lines))
    return '\n\n'.join(out)


def parts(h, body, size=26000):
    """A long section is cut at paragraph breaks into parts titled with their first words, like the other long texts."""
    if len(body) <= 60000: return [[h, body]]
    cs = U.chunk(body, size); res = []
    for i, c in enumerate(cs):
        w = U.preview(c); res.append(['%s · part %d of %d' % (h, i + 1, len(cs)) + (' · ' + w + '…' if w else ''), c])
    return res


def dante(t):
    a = re.search(r'^Inferno: Canto I\s*$', t, re.M); b = re.search(r'^APPENDIX\s*$', t, re.M); t = t[a.start(): b.start() if b else len(t)]
    hits = list(re.finditer(r'^(Inferno|Purgatorio|Paradiso): Canto ([IVXL]+)\s*$', t, re.M)); secs = []
    for i, m in enumerate(hits):
        body = t[m.end(): hits[i + 1].start() if i + 1 < len(hits) else len(t)]
        body = re.sub(r'^(INFERNO|PURGATORIO|PARADISO)\s*$', '', body, flags=re.M)         # the title of the next part, which stands at the end of the last canto before it
        secs.append(['%s: Canto %s' % (m.group(1), m.group(2)), verse_lines(body)])
    return secs, True, 'The Divine Comedy: the Inferno (34 cantos), the Purgatorio (33) and the Paradiso (33), in Longfellow’s blank-verse translation of 1867. Left out: the title page and contents, and the appendix of six sonnets that Longfellow wrote about the poem.'


def milton(t):
    starts = [m for m in re.finditer(r'^Book ([IVXL]+)\s*$', t, re.M)]
    starts = [m for m in starts if m.start() > 2000]                                        # the contents list at the head says BOOK I in capitals; the books themselves say Book I
    end = re.search(r'^Transcriber.s Notes', t, re.M); stop = end.start() if end else len(t); secs = []
    for i, m in enumerate(starts):
        body = t[m.end(): starts[i + 1].start() if i + 1 < len(starts) else stop]
        secs += parts('Book ' + m.group(1), verse_lines(body))
    return secs, True, 'Paradise Lost in twelve books (the arrangement of the second edition, 1674). This edition has no Arguments (the prose summaries Milton put at the head of each book). Left out: the e-text’s own introduction and transcriber’s notes.'


def bunyan(t):
    t = re.sub(r'\s*\{\d+\}[ \t]*', lambda m: '\n' if '\n' in m.group(0) else ' ', t)          # the volunteers' section numbers
    a = t.index('The Author\'s Apology for his Book'); t = t[a:]
    i = t.index('THE PILGRIM\'S PROGRESS'); j = re.search(r'^The Conclusion\.\s*$', t, re.M)
    apology = t[len('The Author\'s Apology for his Book'): i]; apology = re.sub(r'\n[ \t]*JOHN BUNYAN\.[ \t]*\s*$', '', apology.rstrip())
    story = t[i + len('THE PILGRIM\'S PROGRESS'): j.start()]; story = re.sub(r'^\s*In the Similitude of a Dream\s*', '', story)
    conclusion = t[j.end():]
    secs = [['The Author’s Apology for his Book', verse_lines(apology)]]
    secs += parts('The Pilgrim’s Progress', mixed(story)); secs.append(['The Conclusion', verse_lines(conclusion)])
    return secs, True, 'Part One of The Pilgrim’s Progress (the 1678 book; Bunyan’s sequel, Part Two, is not in this file), told as a dream. The words in square brackets, such as [Acts 2:37], are Bunyan’s own marginal references to the Bible, kept as printed. Left out: the e-text’s section numbers and its notes on its own signs. Songs and poems inside the story are kept as verse.'


def lovecraft_cthulhu(t):
    m = re.search(r'^\s*_1\. The Horror in Clay\._\s*$', t, re.M); pre = t[:m.start()]
    ep = re.search(r'"Of such great powers', pre); pre = pre[ep.start():]
    pre = re.sub(r'\[Illustration[^\]]*\]\[\d+\]', '', pre, flags=re.S); pre = re.sub(r'\[Footnote 1: ([^\]]*)\]', lambda mm: '(' + re.sub(r'\s+', ' ', mm.group(1)).strip() + ')', pre)
    pre = U.unwrap(italics(pre))
    hits = list(re.finditer(r'^\s*_(\d)\. ([^_\n]+?)\._\s*$', t, re.M)); secs = []
    for i, h in enumerate(hits):
        body = t[h.end(): hits[i + 1].start() if i + 1 < len(hits) else len(t)]; body = U.unwrap(italics(body))
        if i == 0: body = pre + '\n\n' + body
        secs.append(['%s. %s' % (h.group(1), h.group(2)), body])
    return secs, False, 'The story in three parts, as it appeared in Weird Tales in February 1928, with its epigraph from Algernon Blackwood and the note that it was found among the papers of the narrator. Left out: the magazine illustration’s caption, the transcriber’s note, and the italic marks.'


def lovecraft_festival(t):
    a = t.index('“Efficiunt daemones'); b = t.rfind('[Transcriber'); body = t[a: b if b > a else len(t)]
    return [['The Festival', U.unwrap(italics(body))]], False, 'The story as it appeared in Weird Tales in January 1925, with its epigraph from Lactantius. Left out: the title lines, the transcriber’s note and the italic marks.'


def lovecraft_dunwich(t):
    t = re.sub(r'\[Transcriber[^\]]*\]', '', t, flags=re.S); t = re.sub(r'\[Illustration[^\]]*\]', '', t, flags=re.S)
    hits = list(re.finditer(r'^(\d{1,2})[ \t]*$', t, re.M)); pre = t[t.index('"Gorgons'): hits[0].start()]; secs = []
    for i, h in enumerate(hits):
        body = t[h.end(): hits[i + 1].start() if i + 1 < len(hits) else len(t)]; body = U.unwrap(italics(body))
        if i == 0: body = U.unwrap(italics(pre)) + '\n\n' + body
        secs.append(['Part ' + h.group(1), body])
    return secs, False, 'The story in ten numbered parts, as it appeared in Weird Tales in April 1929, with its epigraph from Charles Lamb. Left out: the transcriber’s note, the captions of the magazine’s illustrations and the italic marks.'


MEANT = {
    'i-dan': 'Dante gave the poem an allegorical purpose of its own (the journey is also the soul\u2019s), but wrote it as a poem under his own name, and the Church has never treated it as scripture or revelation. ',
    'i-mil': 'Milton asked heavenly help in writing it and hoped to \u201cjustify the ways of God to men\u201d, but he offered it as a poem, not as scripture or a new revelation. ',
    'i-bun': 'Bunyan, a preacher who took his authority from the Bible, told it as a story \u201cin the similitude of a dream\u201d, to teach, and did not offer it as scripture. ',
    'i-cth': 'Lovecraft wrote it as a tale of horror for a pulp magazine, Weird Tales; he did not believe in the gods, cults and books in it, which he invented, and never offered them as real. ',
    'i-fes': 'Lovecraft wrote it as a tale of horror for a pulp magazine, Weird Tales; the town, the rite and its hosts are his inventions, and he did not offer them as real. ',
    'i-dun': 'Lovecraft wrote it as a tale of horror for a pulp magazine, Weird Tales; its gods, family and book are his inventions, and he never offered them as real. ',
}
PARSE = {'i-dan': dante, 'i-mil': milton, 'i-bun': bunyan, 'i-cth': lovecraft_cthulhu, 'i-fes': lovecraft_festival, 'i-dun': lovecraft_dunwich}
RIGHTS = {'i-dan': 'Longfellow died in 1882, Dante in 1321.', 'i-mil': 'Milton died in 1674.', 'i-bun': 'Bunyan died in 1688.',
          'i-cth': 'Lovecraft died in 1937 (public domain in the EU and UK); published 1928, so public domain in the US.', 'i-fes': 'Lovecraft died in 1937 (public domain in the EU and UK); published 1925, so public domain in the US.',
          'i-dun': 'Lovecraft died in 1937 (public domain in the EU and UK); published 1929, so public domain in the US.'}


def build(lib, fetch, CACHE):
    res = {}
    for lid, (n, by) in SPECS.items():
        if lid not in lib: continue
        t = U.pg_text(fetch, CACHE, n)
        secs, verse, note = PARSE[lid](t)
        secs = [[h, b] for h, b in secs if len(b.strip()) > 30]
        res[lid] = dict(secs=secs, by=by, license=PG + '. ' + RIGHTS[lid] + ' A work of the imagination, never offered as scripture.', src='https://www.gutenberg.org/ebooks/%d' % n, verse=verse, note=FICTION + MEANT[lid] + note)
    return res


if __name__ == '__main__':
    import build_texts as B
    lib = B.load_lib(); entries = build(lib, B.fetch, B.CACHE)
    for k, e in sorted(entries.items()): print('%-7s %3d sections, %7d chars  %s' % (k, len(e['secs']), sum(len(b) for _, b in e['secs']), e['secs'][0][0]))
    if '--write' in __import__('sys').argv: B.write_all(entries, lib, merge=True)
