"""Search the cached Project Gutenberg catalogue (cache/gutenberg/pg_catalog.csv) for English texts by words of the title and author, to find an ebook number when adding a text. Run from tools/:  python3 catalog_search.py "blavatsky+secret doctrine" "frazer+golden bough"   (words joined by + must all be present)."""
import csv, sys, re
rows = list(csv.DictReader(open('cache/gutenberg/pg_catalog.csv', encoding='utf-8')))
def find(*pats, lang='en', n=12):
    out = []
    for r in rows:
        if r['Type'] != 'Text' or lang not in r['Language']: continue
        hay = (r['Title'] + ' | ' + r['Authors']).lower()
        if all(re.search(p, hay) for p in pats): out.append((r['Text#'], r['Title'].replace('\n', ' ')[:90], r['Authors'][:50]))
    return out[:n]
if __name__ == '__main__':
    for q in sys.argv[1:]:
        print('##', q)
        for x in find(*q.lower().split('+')): print('  ', *x, sep=' | ')
