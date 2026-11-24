"""Specs for a twentieth batch of open (pre-1931) English texts (17 November 2026), continuing the maker's "get as close as we can to covering all the religions": the heterodox
Muslim communities of Anatolia and Syria that no earlier book in the Library described (Hasluck on the Bektashi and the Kizilbash, Lyde on the Ansaireeh or Nusairis). Merged into
texts_archive.SPECS; built with python3 build_texts.py --only=ids.
"""
from texts_round9 import S, SCH, REF
from texts_round10 import G, T, FIELD
from texts_round8 import MOV

SPECS = {}
NEW = 'Bahá’í, Theosophy'
fix = lambda i, **kw: SPECS[i].update(kw)


def sch(i, idents, by, note, title, when, **kw):
    if kw.get('split', 'auto') == 'auto': kw.setdefault('min_chars', 250)
    SPECS[i] = G(idents, by, note + ' ' + SCH, lib=S(title, when), **{'split': 'auto', **kw})


sch('x-hsl', ['christianityandi032456mbp', 'in.ernet.dli.2015.56727'], 'F. W. Hasluck, Christianity and Islam under the Sultans, edited by Margaret M. Hasluck, two volumes (Oxford: Clarendon Press, 1929)',
    'The librarian of the British School at Athens’s study of how Christians and Muslims shared saints, shrines and holy places in the Ottoman lands: the saints and shrines that passed from one religion to the other, the Bektashi dervishes and their tekkes (and their link with the Janissaries), the Kizilbash (the Alevi of Anatolia), the Hurufi and the Yezidis, the cult of Khidr, the Sarı Saltık legends and conversion between the faiths, with the author’s notes from his years in Greece and Turkey (1899–1916). Edited and published after his death in 1920; in two volumes.',
    'Christianity and Islam under the Sultans (F. W. Hasluck, 1929), two volumes', '1929 CE (recorded 1899–1920)', split=None)
sch('x-lyd', 'asianmysteryillu00lyderich', 'Samuel Lyde, The Asian Mystery, Illustrated in the History, Religion, and Present State of the Ansaireeh or Nusairis of Syria (London: Longman, Green, Longman and Roberts, 1860)',
    'A Victorian English book on the Nusairis, now called Alawites: an account of their history, their land in the mountains of north Syria, their religion (the place of Ali, the Nusairi catechism and their mass), their customs and the Arab writers who described them, by a Fellow of Jesus College, Cambridge, who had lived in Syria as an Anglican missionary and wrote an earlier book on the Ansaireeh and Ismaeleeh, from his visits among them and from their own books and catechism. A Christian missionary’s account, hostile to the sect, written when the community kept its books secret; modern Alawites do not recognise every claim in it.',
    'The Asian Mystery: the Ansaireeh or Nusairis of Syria (Samuel Lyde, 1860)', '1860 CE')

sch('x-ajm', 'in.ernet.dli.2015.213052', 'Har Bilas Sarda, Ajmer: Historical and Descriptive (Ajmer: Fine Art Printing Works, 1911)',
    'A civil judge’s illustrated account of Ajmer in Rajasthan: the city and the old fort of Taragarh, the lake of Ana Sagar, the mosque known as the Adhai-din-ka Jhonpra, the Dargah of Khwaja Muinuddin Chishti (the shrine of the founder of the Chishti order in India, its buildings, its endowments, the annual Urs and the pilgrims) and the Muslim shrines of the town, the Pushkar lake and the town’s history. Mostly a guide for visitors; the chapter on the Dargah is the part that bears on the Chishti order.',
    'Ajmer: Historical and Descriptive (Har Bilas Sarda, 1911)', '1911 CE', split=None)

# repairs after the test build: the index and the library slips at the end of Hasluck; the publisher's catalogue after "THE END" in Lyde
fix('x-hsl', cut_tail=r'^\s*INDEX\s*$')
fix('x-lyd', cut_tail=r'^\s*THE END\.\s*$')
