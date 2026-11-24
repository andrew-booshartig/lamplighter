# Contributing

Thank you. The Lamplighter Project is a free tool for studying human religion, built to be neutral, sourced and quiet. A correction is the most useful thing you can send.

## The easiest way to help: say what is wrong

- **Something is broken, confusing or missing.** Open an issue with the "Something is broken or confusing" form. Or use the box under Setup, "Tell the maker what to change", in the app: it writes a plain-text note (the page you were on, your browser and screen, what you wrote) that you copy or save and paste into an issue. The app sends nothing itself.
- **A fact, a date, a translation or an attribution looks wrong.** Use the "A fact, date or translation looks wrong" form. Say which page, what it says, what you think is right, and where you read it. A source we can open beats an opinion, and a specialist's view of a field is exactly what the project lacks.
- **A text to add.** Use the "A text to add" form. Only texts in the public domain in the United States (published before 1931) or under an open licence can go into the Library. Newer books are listed with where to find them and never copied.

## Ground rules

These are kept by tests, not by taste.

- **Neutral.** No tradition is ranked above another. No verdict in the tool's own voice on a living community or person. A claim says how well it is attested: documented, reported or claimed, or disputed. (`lamplighter/tests/neutral.test.js`, `history.test.js`, `movements.test.js`)
- **Private.** No network call of the app's own, no tracker, no cookie, no font or script from another site. (`lamplighter/tests/privacy.test.js`)
- **Plain words.** One name for one thing, no jargon on a first screen. (`lamplighter/tests/label-sweep.test.js`)
- **Sourced.** A text keeps its printed pages, its source and its licence. A fact on a card names where it comes from.
- **Quiet.** Content first, controls under it, no animation for its own sake, no flashing at any rate.

## Code

- The sources are `lamplighter/src/js/*.js`, numbered in load order, and `lamplighter/src/css/app.css`. `lamplighter/build.py` bundles them into one file, `Lamplighter.html`. There is no framework, no bundler and no dependency.
- Build and run: see "Build from source" in the [README](README.md). Run one test with `node lamplighter/tests/<name>.test.js`; each prints how many checks passed. The few tests that need the data folders (`texts/`, `similar/`, …) are listed in `lamplighter/tests/ci-needs-data.txt`.
- Please do not change the storage names (`beatlab.v1.`, `beatlab-own`, `lamplighter-pdfs`, `beatlab-data-`, `beatlab-shell-`, `BEATLAB_*`). They are older names kept on purpose so that nobody's saved notes and offline copies disappear.
- Open a pull request with what you changed and why. Small and focused is best, with a test beside any change of behaviour. If a test must change, say why in the description: a test is a promise.

## Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). The project is about things people hold dear: please assume good faith and argue from sources.
