# Handoff: the Atlas of humanity's search for the divine

**Read this first.** It explains what the app is for, what already exists, what to build next, and how to use the data in this package. `README.md` is the reference for the data itself.

## 1. The goal

In the owner's words:

> "We need every example of man reaching towards god and all the ways they attempted to connect with each other and the infinite energy source we come from."

> "The end user will be able to move a slider through time and watch religion as if it's an organism growing on the planet."

The app is a place to explore that search, from the first burials over 100,000 years ago to today, and to practise some of those ways of connecting. Everything the user sees is in English.

Three parts should feel like one experience:

1. **The Atlas**: a time slider and world map where belief systems appear, spread, branch, meet, clash, blend and fade.
2. **The Library**: the scriptures, hymns, laws, myths and oral traditions of those belief systems.
3. **Practice**: the meditation section and the sound library, linked to the historical ways people prayed, chanted, drummed, fasted and meditated.

## 2. Where the app is today

As described by the owner. Read the code before changing anything.

- A **meditation section**.
- A **library** with some **binaural beats**.
- A **timeline** that works but is primitive and needs refinement.

Keep the meditation and audio features working. Grow the existing timeline into the Atlas below rather than adding a second timeline. Use the stack, design system and storage the app already has: this package is plain files and fits any stack.

## 3. What to build

### 3.1 The Atlas (top priority)

Must have:

- **One slider from 340,000 BCE to 2026.** Compress the deep past with the piecewise scale in `handoff/app_config.json` (`slider_scale`) and label it with the era bands (`eras`).
- **Scrub, step and play.** Arrow keys and taps step; a play button runs a time-lapse with adjustable speed.
- **Living map.** Show every presence row active at the slider year (rule in section 4). Size by `prominence`, colour by family group, draw country-level rows as large soft blobs and place rows as sharper points. Fade in across each row's uncertain start window and fade out after its end. It should read as growth and decline, not dots blinking on and off. Details are in `presence_rendering`.
- **Births and links.** Pulse at a tradition's origin when it begins. Draw arcs for interactions active at the slider year, styled by group: lineage, exchange or pressure (`interaction_groups`).
- **Events.** Show `timeline_events` for the visible window, thinned by importance (`event_density`).
- **Selection.** Tapping a tradition opens its page (3.4) and highlights its presence, its ancestors and descendants, and its interactions.
- **Filters and search.** Filter by family group or family, tradition, practice ("show everyone who used drumming", "…meditation", "…sacred plants") and text category.
- **Visible uncertainty.** Show `date_label` everywhere, soften circa dates, flag contested (`C`) dates.
- **Shareable state.** Keep year, selection and filters in the URL or route.

Should have:

- A density strip or stream graph under the slider showing how many traditions are active per family group over time (computed from `presence`).
- A story mode that stops at importance-5 events and shows their notes.
- Zoom from world to region, with labels only for the most prominent traditions to avoid clutter.

### 3.2 The Library

- Add the 2,307 text records to the existing library. Browse by tradition, family, era, region, category group and status (`text_category_groups`); search by title.
- Each record shows title, original title, tradition, category, language, `date_label` with confidence, place, status and note. **Show on map** jumps the Atlas to that date and place.
- These are catalogue records, not the texts themselves. If full texts are added later, use only public-domain or licensed translations and credit the translator.
- The binaural beats stay where they are and become the sound side of Practice.

### 3.3 Practice: bridges to meditation and sound

- The database lists 72 practices (`practices`) and which traditions used them (`tradition_practices`, 1,392 links).
- From a meditation session, offer **"Who else practised this?"**: the traditions that used meditation, breath, chant, prayer or mystical union (`practice_links.meditation_section`), opening the Atlas filtered to them.
- From the Atlas, a tradition's practices link to matching meditation sessions and sound tracks (`practice_links.sound_library` covers chant, hymn and drumming).
- Binaural beats are a modern technique. Present them as a modern way of working with sound and rhythm, never as something ancient peoples used.

### 3.4 Tradition page

Name and original name; family and kind; status (living, extinct, revived, or a historical phase that became something else); dates with confidence; founder; summary; origin on a mini map; parent, children and the full lineage to the root; presence over time; interactions written as sentences ("Split from…", "Influenced…"); texts; sites; practices. Only six traditions have adherent counts; elsewhere show "no reliable count" rather than a guess. Many optional fields (founder, original name) are blank, so every field needs an empty state.

## 4. The data

### Package contents

| Path | Size | Use |
|---|---:|---|
| `out/json/traditions.json` | 436 KB | Load at start |
| `out/json/presence.json` | 738 KB | Load at start: the map |
| `out/json/interactions.json` | 122 KB | Load at start: the arcs |
| `out/json/families.json`, `countries.json` | 30 KB | Load at start |
| `out/json/texts.json` | 955 KB | Load with the Library |
| `out/json/sites.json` | 181 KB | Load with sites |
| `out/json/practices.json`, `tradition_practices.json` | 106 KB | Load with Practice |
| `out/json/timeline_events.json` | 2.0 MB | Load later, or derive from the tables |
| `out/religion_atlas.sqlite` | 2.5 MB | The same data as one SQLite file (works with native SQLite or sql.js) |
| `out/religion_atlas.json` | 4.2 MB | Everything in one file, including `meta` and code lists |
| `out/geojson/*.geojson` | | Point layers for map libraries |
| `handoff/app_config.json` | | Recommended slider scale, eras, styling groups and section links |
| `handoff/fixtures.json` | | Known answers for testing the data layer |
| `data/*.psv`, `build.py` | | Editable source files and the build script |

Every row carries its own `lat`, `lon` and `country_iso2`, so `places.json` is needed only for place names.

### Rules every query must follow

- **Years** are signed integers: negative = BCE. There is no year 0 (1 BCE = −1, 1 CE = 1).
- **Date windows**: each date has an earliest year (`year_start` or `start_year`) and a latest year (`*_latest`). `circa = 1` means approximate.
- **Presence rule**: a row is on the map at year Y if `year_start <= Y AND (year_end IS NULL OR year_end >= Y)`.
- **Null ends**: in `presence`, the tradition is still there; in `interactions`, the interaction is ongoing; in `sites`, the site is still standing or in use. Texts always have an end (the end of their composition window).
- **Prominence** (1–5) is an approximate share of the local population: 5 majority, 4 large minority, 3 significant minority, 2 minority, 1 small community or diaspora. It is not a headcount; the legend must say so.
- **Confidence**: `H` well documented, `M` scholarly consensus, `L` rough estimate, `C` contested.
- **Lineage**: `traditions.parent_id`, `root_id` and `lineage_depth`.
- Every code is defined in the `code_lists` table (`codes` in the JSON bundle).

## 5. Rules for content

1. **Do not invent or alter data in the app.** No made-up dates, places or counts, and no silent rounding or "fixing". If something looks wrong, report it (section 8).
2. **Show uncertainty.** Use `date_label` and the confidence label. Mark oral traditions, disputed authenticity (`dis`) and outsider records (`eth`: accounts by missionaries, officials or anthropologists).
3. **Neutral, respectful voice.** Describe each tradition on its own terms. Do not rank religions or declare any of them true. The owner's spiritual framing is the app's theme, not a verdict to apply to the data.
4. **Indigenous and oral traditions.** Their dates are rough and mark first attestation, not the beginning of a people's spiritual life; say so. Do not add sacred material a community keeps restricted.
5. **Hard history** (persecution, genocide, destroyed sites) is recorded factually; keep it factual in the interface.
6. **Prehistoric horizons** (family `prehistoric`, kind `arch`) are archaeological groupings. Label them "inferred from archaeology".
7. **Places.** Jerusalem is coded `IL` for mapping only; its status is disputed. West Bank and Gaza sites are coded `PS`. Never present modern borders as historical ones.
8. **Credit sources** on an About screen: the `sources` table and Pew Research Center for the adherent counts.

## 6. Definition of done

- The data layer reproduces every check in `handoff/fixtures.json` (snapshot counts, lineages, specific rows).
- Scrubbing stays smooth on a mid-range phone with all present-day rows on the map (about 1,400).
- Moving from 2026 back to 340,000 BCE and forward again shows growth and decline without flicker.
- Every date shown is a `date_label` or follows the same format; "0 CE" never appears.
- All 721 tradition pages open without errors, including those with blank fields.
- All 2,307 texts appear in the Library with working filters and "show on map".
- Practice links work in both directions.
- Existing meditation sessions and binaural tracks still play.
- The slider works from the keyboard, colour is never the only cue, and screen readers get a text list of what is on the map at the current year.

## 7. Suggested order of work

1. Read the existing code and note how the current timeline gets its data.
2. Data layer: load the package, implement the presence rule and lineage, pass `fixtures.json`.
3. Atlas basics: slider with scale and eras, map with presence, tradition panel.
4. Motion: fades, origin pulses, arcs, play mode, density strip.
5. Library integration.
6. Practice bridges.
7. Polish: performance, accessibility, shareable state, About screen.

## 8. Changing or reporting data

- The data lives in `data/*.psv`: pipe-separated text, one row per line, `#` for comments. Edit, then run `python3 build.py` (regenerates `out/`) and `python3 handoff/make_fixtures.py` (regenerates the fixtures). Python 3, standard library only.
- `build.py` refuses broken references, impossible dates and malformed rows, and warns when a row predates its tradition.
- Never hand-edit `out/`; it is overwritten on every build.
- Tradition ids are stable. Text and site ids are built from titles and names, so they change if a title changes; plan a migration before storing them in user data such as favourites.
- Report suspected data errors to the owner with the table, the id and the reason.

## 9. Decisions to confirm with the owner

- Flat map or 3D globe.
- Whether to add full texts, and from which translations.
- Visual design: follow the existing app unless told otherwise.
