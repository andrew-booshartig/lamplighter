# World Religion Atlas — database

A dated, mapped database of human religion from the first known burials (about 120,000 years ago) to 2026. It is built to drive a web app with a time slider and a world map, where belief systems appear, spread, meet, split and fade like a living organism. Everything is in English; native-language names and titles are kept in separate `*_original` fields where given.

**Building the app? Start with `HANDOFF.md`**: it sets out the goal, the current state of the app, what to build and how to test it. This README is the data reference.

## What is inside

| Table | Rows | What it holds |
|---|---:|---|
| `traditions` | 721 | Every religion, branch, school, movement, ethnic or Indigenous religion, esoteric current, new religious movement and archaeological horizon, with dates, origin point, parent and lineage |
| `texts` | 2,307 | Scriptures, hymns, liturgies, laws, myths, commentaries, inscriptions, oral corpora and outsider records, each dated and placed |
| `sites` | 488 | Sacred and archaeological sites, from Palaeolithic burials and cave art to temples, mosques, churches, shrines and sacred mountains |
| `presence` | 2,199 | Where each tradition was found, when, and how strongly (1–5): the rows that make the map grow |
| `interactions` | 382 | Derivations, schisms, reforms, syncretism, conversions, persecution, transmission, dialogue and revivals between traditions |
| `practices` | 72 | Ways people reach toward the divine: prayer, sacrifice, trance, meditation, pilgrimage, divination, entheogens and more |
| `tradition_practices` | 1,392 | Which traditions use which practices |
| `timeline_events` | 5,537 | One merged, sortable stream of everything above, with an importance score for the slider |
| `places` / `countries` | 993 / 209 | Coordinates for every place id and country centroid |
| `families` | 20 | Colour groups for the map (Abrahamic, Dharmic, African, Americas, prehistoric …) |
| `adherents` | 6 | 2020 global totals from Pew Research Center |
| `sources` | 25 | Reference works and the papers used to check key dates |
| `meta`, `code_lists` | — | Conventions and the meaning of every code |

At a few sample years the map holds: 4 traditions in 8 places at 40,000 BCE; 20 in 41 places at 2000 BCE; 174 in 411 places at 800 CE; 289 in 696 places at 1500; 561 in 1,373 places today.

## Files

- `out/religion_atlas.sqlite` — the full database (SQLite). Includes the view `v_presence_named`.
- `out/religion_atlas.json` — every table in one JSON file, plus `meta` and `codes`.
- `out/json/*.json`, `out/csv/*.csv` — one file per table.
- `out/geojson/` — point layers ready for a map: `timeline_events`, `presence`, `sites`, `texts`, `traditions`.
- `out/schema.sql` — table definitions. `out/stats.json` — counts.
- `data/*.psv` — the human-editable source files (pipe-separated). `build.py` validates them and regenerates everything in `out/`.
- `handoff/app_config.json` — recommended slider scale, era bands, styling groups and links to the app's meditation and sound sections.
- `handoff/fixtures.json` — known answers the app's data layer must reproduce; regenerate with `python3 handoff/make_fixtures.py`.

To rebuild after editing: `python3 build.py`, then `python3 handoff/make_fixtures.py` (Python 3 standard library only). The build stops with an error on any broken reference, impossible date or malformed row, and warns when a row predates its tradition.

## Conventions

**Years.** Signed integers: negative = BCE, positive = CE. There is no year 0 (1 BCE = −1, 1 CE = 1). Range −500,000 to 2026.

**Date windows.** Each date has an earliest (`*_start` or `start_year`) and latest (`*_latest`) year; equal values mean a precise date. `circa` = 1 marks an approximate date. `date_label` is a ready-made display string such as "c. 1200–1000 BCE".

**Confidence** (`date_confidence`): `H` high (documented), `M` medium (scholarly consensus window), `L` low (rough estimate, typical for oral and Indigenous traditions), `C` contested (scholars disagree; see the note).

**Presence rule.** A tradition is on the map at year Y at a row's location if `year_start <= Y AND (year_end IS NULL OR year_end >= Y)`. Each living tradition also gets an automatic `origin` row (`auto = 1`) at its place of origin.

**Prominence** (presence rows) is an approximate share of the local population, not a headcount: 5 = majority or dominant (over ~50%), 4 = large minority or co-dominant (~25–50%), 3 = significant minority (~10–25%), 2 = minority (~1–10%), 1 = small community, diaspora or trace. Changes over time are separate rows (e.g. Christianity in Egypt: 2 → 5 → 4 → 3 → 2).

**Site end** (`sites.year_end`): blank = still standing or in religious use; a year = end of religious use (abandonment, destruction or conversion); equal to the start = a single event such as one burial.

**Places.** A place token is either a place id (a city or site) or a two-letter country code, which resolves to the country's centroid. Every row carries denormalised `lat`, `lon` and `country_iso2`. Coordinates are approximate (~10 km).

**Jerusalem and disputed territories.** Jerusalem is coded `IL` for mapping convenience only; its status is disputed. Sites and rows in the West Bank and Gaza (Bethlehem, Hebron, Jericho, Qumran, Mount Gerizim) are coded `PS`. Other borders follow present-day UN country codes and say nothing about historical or political claims.

## Code lists

- **Tradition kind:** `rel` religion, `br` major branch, `sch` school/sect/order/denomination, `mov` movement or revival, `eth` ethnic or Indigenous religion, `phil` philosophy, `myst` mystery cult, `esot` esoteric current, `nrm` new religious movement, `syn` syncretic religion, `cult` cult of a deity, `arch` archaeological or reconstructed horizon.
- **Tradition status:** `L` living, `X` extinct, `R` revived or reconstructed, `H` historical phase that evolved into a successor.
- **Text category:** `scr` scripture/canon, `hym` hymn/prayer/song, `rit` ritual/liturgy, `law` religious law, `myth` myth/sacred epic, `wis` wisdom/ethics, `com` commentary, `mys` mysticism/esoteric, `div` divination/omens, `his` sacred history/hagiography, `phi` theology/philosophy, `ora` oral corpus, `eth` ethnographic or outsider record, `ins` inscription, `mag` magic/spells, `cal` sacred calendar/astronomy, `dev` devotional classic.
- **Text status:** `ext` extant, `lost`, `frag` fragmentary, `oral` (no fixed written form), `und` undeciphered or not understood, `rec` reconstructed, `dis` authenticity disputed.
- **Site type:** burial, art, figurine, sanctuary, temple, shrine, monastery, church, mosque, synagogue, stupa, megalith, mound, city, cave, natural, grove, deposit.
- **Presence event:** origin, arrive, expand, state (adopted by a ruler), major, decline, suppress, extinct, revive, diaspora, mission, persist.
- **Interaction type:** derive (target arose from source), influence, syncretism, schism (target split from source), reform, conflict, persecution (source persecuted target), transmission, coexist, convert (source won converts from target), dialogue, revive (target revives source), absorb, suppress. A blank end means a single moment; an open end means ongoing.

The full text of every code is in the `code_lists` table.

## Using it in the app

- **Time slider:** query `presence` with the presence rule, size circles by `prominence`, colour by the tradition's `family_id`. Fade in `timeline_events` whose window covers the slider year; `importance` (1–5) decides what shows at low zoom.
- **Growth as an organism:** `traditions.parent_id`, `root_id` and `lineage_depth` give the family tree; `interactions` give the arcs between traditions (draw from the source's origin to the interaction's place).
- **Detail panels:** texts, sites and practices for the selected tradition; `note` fields hold one-line context.

Example — what is on the map in 800 CE:

```sql
SELECT p.tradition_id, t.name, t.family_id, p.lat, p.lon, p.prominence, p.event
FROM presence p JOIN traditions t ON t.id = p.tradition_id
WHERE p.year_start <= 800 AND (p.year_end IS NULL OR p.year_end >= 800);
```

## Limits and cautions

- **Dates of oral and Indigenous traditions are rough** (confidence `L`). Their start dates mark when a recognisable tradition is attested or reasonably inferred, not when the people's spiritual life began. Many oral corpora are listed with the period of their oral life and the date they were first written down.
- **Prehistoric horizons** (`family = prehistoric`, kind `arch`) are archaeological groupings. Their beliefs are inferred from burials, art and monuments; they are not self-named religions. Proto-Indo-European religion is a linguistic reconstruction.
- **Outsider records** (`category = eth`) are accounts by missionaries, colonial officials or anthropologists. Some are contested or rejected by the communities described; this is flagged in notes and with status `dis`.
- **Prominence** is an informed approximation for mapping, not census data. Only six adherent totals are included, all from Pew Research Center's 2020 estimates.
- **Coverage is broad but cannot be complete.** Africa, Oceania and the Americas include many oral traditions that have few written texts; they appear through oral-corpus entries, sites, practices and presence rows.
- Sensitive present-day events (such as persecution of Yazidis, Bahá'ís and Ahmadis, or restrictions in Xinjiang and Tibet) are recorded factually in notes without judgement.

## Sources

General references: *Encyclopedia of Religion* (2nd ed.), *Oxford Dictionary of World Religions*, Encyclopaedia Britannica, the Electronic Text Corpus of Sumerian Literature, UNESCO's World Heritage, Intangible Heritage and Memory of the World lists, Melton's *Encyclopedia of American Religions*, Clarke's *Encyclopedia of New Religious Movements* and Olupona's *African Spirituality*. Key dates were checked against the studies listed in the `sources` table (e.g. Leang Karampuang, Nature 2024; Chauvet, PNAS 2016; Hilazon Tachtit, PNAS 2008; the German Archaeological Institute on Göbekli Tepe; Pew Research Center 2025).
