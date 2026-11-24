# What the Library left out, sorted by why (17 November 2026)

On the maker's words "the people need all the information available to decide for themselves ... leave no stone unturned", every list in `TEXT_AUDIT.md`, `ROADMAP.md`, `README.md`, `FACT_CHECK.md`, `COVERAGE_ASSESSMENT.md` and the spec files (`tools/texts_*.py`) that said something was left out "on purpose", "by rule" or "by design" was read and each item sorted:

- **(a) Left out for a reason of rights.** In copyright, or a scan or e-text whose terms forbid redistributing it unchanged, or a scan whose pictures are of unclear rights. These stay out, and the ones first published after 1930 are on `POST1930_WANTED.csv`.
- **(b) Left out for any other reason**: because it records a ritual, a secret rite, a sacred object, an initiation or a restricted teaching; because it was thought too sensitive; or by an earlier assistant's judgment. These go in, labelled honestly ("Understood, not endorsed"), never omitted. The rule that kept them out was never the maker's and was withdrawn on 17 November 2026.
- **(c) Left out because no usable open scan was found** (a lending-only scan, a garbled one, a partial one). Not a decision about the book: it is wanted, and the list below says what is needed.

## (b) now in, and what was built for it

| Item | Where it was said to be left out | Now |
|---|---|---|
| Lumholtz, *Symbolism of the Huichol Indians* | `texts_round12.py`, `COVERAGE_ASSESSMENT.md` | was already in (`a-hsy`, a later round); the old statements were stale |
| Densmore, *Chippewa Music* (I and II) | same | in: `a-dc1`, `a-dc2` (round 22), with her Teton Sioux, Mandan and Hidatsa, Pawnee and Papago volumes (`a-dtn`, `a-dmn`, `a-dpw`, `a-dpg`) |
| Fewkes, Hopi Katcinas | `TEXT_AUDIT.md` item 15 | in: `a-fkt` (round 22), with Fewkes's Hano solstice altars and Tusayan Flute and Snake ceremonies, Voth's Powamu, Soyal and Marau, Stevenson's Zuñi and Sia (`a-fws`, `a-fft`, `a-vpw`, `a-vso`, `a-vmr`, `a-stz`, `a-sia`) |
| Dorsey, Cheyenne Sun Dance | same | in: `a-dch` (round 22), with Dorsey's Arapaho Sun Dance, Wissler's Blackfoot Sun Dance and Ceremonial Bundles, Lowie's Crow Sun Dance and Shoshone societies, Skinner's Menomini medicine ceremony and bundles, Matthews's Mountain Chant, Boas on the Kwakiutl secret societies, Roth's Queensland records |
| The Nusayri (Alawite) secret books | `texts_round12.py`, `COVERAGE_ASSESSMENT.md` | in: `x-nsr` (round 23), Salisbury's 1866 notice of Sulaiman Effendi's *Book of the First Ripe Fruit* with long extracts (the fullest English report of the secret teaching before 1931); `x-lyd` (Lyde, 1860) was already in |
| Masonic ritual exposures | `ROADMAP.md`, the Masonic shelf's status line, the Path note | in (round 23): Prichard 1730 (`k-prc`), *Jachin and Boaz* 1762 (`k-jab`), *The Three Distinct Knocks* (`k-tdk`), Morgan 1826 (`k-mor`), Bernard's *Light on Masonry* 1829 (`k-ber`), Allyn's *Ritual of Freemasonry* with its Royal Arch, Templar and Odd Fellows rituals (`k-aly`), Duncan's *Ritual and Monitor* 1866 (`k-dun`) |
| Mormon temple ritual exposés | not listed (the gap) | in (round 23): Van Dusen's account of the Nauvoo endowment of 1846 (`x-vdu`), Mary Ettie Smith's *Fifteen Years among the Mormons* (`x-mgr`) |
| Templar rites and history | not listed | in: Addison's *History of the Knights Templars* (`x-tmp`), and Allyn's and Bernard's Templar degrees above |
| Grimoires and magical rituals | the occult shelf's gaps | in (round 23): the *Sixth and Seventh Books of Moses* (`m-67m`), Albertus Magnus's *Egyptian Secrets* (`m-alb`); the Key of Solomon, Goetia, Abramelin (Book II), Heptameron, Fourth Book, Grand Grimoire, Black Pullet, Arbatel and Waite's Ceremonial Magic were already in |
| Eleusinian and Mithraic rites | not listed | in (round 23): Taylor's *Eleusinian and Bacchic Mysteries* (`x-elb`), Mead's *A Mithriac Ritual* (`x-mir`, with the note that scholars no longer call the papyrus Mithraic); Cumont's *Mysteries of Mithra* was already in |
| Theosophical and Rosicrucian ritual | not listed | in (round 23): Leadbeater's *Science of the Sacraments* (the Liberal Catholic Mass, `v-sos`), Heindel's *Rosicrucian Cosmo-Conception* (`v-hrc`) |
| Voodoo accounts before 1931 | not listed | in (round 23): Owen's *Old Rabbit, the Voodoo* (`a-ovd`) and Hesketh Prichard's *Where Black Rules White* (`a-hti`), with the Library's earlier St John, Léger, Hearn, Puckett and Seabrook |
| Le Plongeon, *Sacred Mysteries among the Mayas and the Quiches* | not listed | in (`a-lpl`), labelled a popular claim whose dating scholars reject |
| Jung, *Psychology of the Unconscious* | `texts_round8.py` ("a psychology book, not a religious text") | in: `x-jng`, on the scholarship shelf |
| Kautilya's *Arthashastra* | `TEXT_AUDIT.md` (searched for, left out) | in: `x-kau` (Shamasastry, the third edition of 1929 as a later Mysore reprint) |
| "Sacred songs ... left out by design" (Sound page); "sacred art of Aboriginal and Native American peoples ... left out by design" (Sacred art page) | `ROADMAP.md`, `README.md`, `src/js/6zt-sound.js`, `src/js/6zu-image.js` | the pages' wording was corrected (they play or draw only what the app can build from a rule; the Library's field records print and describe the songs and the art) |
| "Public teachings only" (North America shelf status, Path label); "Ritual exposures are left out on purpose" (Masonic shelf status line, Library intro, Path note); "Only public teachings are included" (animism care note) | `src/js/2z-library-core.js`, `6g-library.js`, `24-data-path-lib.js`, `2z-belief-core.js` | rewritten to say what the shelves now hold |
| The pictures of the books of rites of living peoples (Spencer and Gillen, Howitt, Matthews, Dorsey, Midē'wiwin, Cherokee formulas) | `ROADMAP.md`, `FACT_CHECK.md` | being restored by the picture session (the Gutenberg pictures of `a-chsf` and `a-mide` are written; the plates of `a-spen`, `a-nnca`, `a-nchn` and `a-siou` are being fetched; `a-howi` and `a-navl` keep only their PDF link because the plate tool cannot separate their layout) |
| Pawnee *Hako*, the Zuni and other Pueblo peoples, the Itelmen, Aboriginal songlines on the map | Atlas rows, `FACT_CHECK.md`, `COVERAGE_ASSESSMENT.md` | the Atlas session added the Pueblo rows; the Itelmen and the songlines are a map question left to the Atlas owner |

Still left, and not for rights: the Atlas's note that "restricted knowledge and sacred routes are not reproduced or mapped" (`README.md`), which describes what the map draws (it draws no secret route), and the advice in the lessons to "leave closed ceremonies to the communities" (`src/js/2j-lessons-f.js`), which is a courtesy to a learner and not a ban. Both are for the maker to confirm.

## (a) left out for rights (stay out; post-1930 ones are on `POST1930_WANTED.csv`)

| Item | Why |
|---|---|
| Bahá'u'lláh, *Hidden Words*, and the other Bahá'í Gutenberg files | the Bahá'í International Community's terms allow copying only without any change to the text; sectioning is a change; the Library points to bahai.org/library |
| Pines's 1963 translation of the *Guide of the Perplexed* | in copyright; the Library holds Friedländer's 1904 |
| The in-copyright Bibles (NIV, ESV, NASB, RSV, NRSV, JPS 1985, Jerusalem Bible) | in copyright; on the CSV |
| *The Equinox* (vol. I) as the open e-text | O.T.O.'s typeset file claims copyright and says it "may be freely distributed unmodified"; the original 1909–13 print has no open scan |
| *The Book of the Law* as the one open file | the 1938 edition with Crowley's later commentary; the 1912 *Equinox* text has no open scan |
| Finney, *Character, Claims and Practical Workings of Freemasonry* | the only file is a 1999 e-text with a notice that it "is not to be changed in any way"; the 1869 original needs a scan |
| The colour plates of the Goetia scan | modern drawings whose rights are unclear; the text is in, the plates are not |
| Regardie's *Golden Dawn* (1937–40), Hubbard's books and every other book first published after 1930 | on the CSV |
| Michelet's *La Sorcière* in English and Lea's *Materials toward a History of Witchcraft* | the 1939 editions are in copyright; on the CSV |
| The Ugaritic tablets in English | no English before 1931; on the CSV |
| Roerich's and Alice Bailey's later books | after 1930; on the CSV |

## (c) left out because no usable open scan was found

| Item | What is needed |
|---|---|
| Crowley, *Magick in Theory and Practice* (Paris, 1929: public domain) | the Wellcome scan answers 403; another open scan |
| Remy's *Demonolatry* (Summers, 1930), Rattray's *Akan-Ashanti Folk-Tales* (1930), *Fairy Tales of Modern Greece* (1930) | first published 1930, so now public domain; an open scan (the Rattray and Handy scans on the Archive are lending-only) |
| Handy's *Polynesian Religion* (1927), Budge's *Coptic Martyrdoms* (1914), the Roman Catholic volume of Cary | lending-only scans on the Archive |
| Chamberlain's *Kojiki* (1882), Satow's *Ancient Japanese Rituals* (1879–81), Matthews's *Mishkat al-Masabih*, Wong Mou-lam's *Platform Sutra* (1930) | an open full-text scan |
| The *Desatir* | a scan whose Persian pages are not noise |
| Best's *Tuhoe* and *Maori Religion and Mythology*, Landtman, Ivens, Woodford, Hamberg's *Visions of Hung-Siu-tshuen*, the Vailala Madness report, Cowan vol. II | no scan found |
| Temple's *Thirty-Seven Nats*, the *Royal Parchment Scroll*, Macdonald's *Africana* vol. I, Westermarck's *Ritual and Belief in Morocco* vol. I, Burkitt's *Manichees* | a complete scan |
| Glanvill's *Saducismus Triumphatus*, the *Ars Notoria* (Turner, 1657), Guyon's *Short and Easy Method* | a scan with a usable text layer (long s; a running head on every page) |
| Fornander's *Collection of Hawaiian Antiquities and Folk-lore* (three volumes), Burton's *Nights*, Chatelain's *Folk-Tales of Angola* | a round of their own (size is no objection); not yet fetched |
| The pre-1931 books in other languages (Ortiz, *Los negros brujos*, 1906; Dussaud, *Histoire et religion des Nosairis*, 1900; Price-Mars, *Ainsi parla l'oncle*, 1928) | the Library's texts are English; they are public domain and could be added in their own language |
| US government publications after 1930 (Bunzel's Zuñi volumes, 1932, and later Bureau of American Ethnology reports) | a check of their status and a fetch |
