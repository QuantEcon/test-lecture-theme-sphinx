# tests/harness — the rendered checks

*Playwright, run against this corpus's own build, checking the site features of the theme-parity harness (QuantEcon/project-theme-parity#15, D9) and every page for error markers, console errors and sideways scrolling; it writes `rendered.csv` and `provenance.json`, which CI publishes at `/_harness/`.*

Last updated: 2026-11-24

This is layer 3 of the parity harness, the Sphinx side of QuantEcon/test-lecture-theme-sphinx#3. Its twin in QuantEcon/test-lecture-theme-mystmd checks the mystmd site with the same engine and writes the same CSV, and QuantEcon/project-theme-parity folds the two files into a pass. The parity repository is private, so the checks live here, where this repository's CI can run them on the build it just made.

## Running it

```bash
cd tests/harness && npm ci && npx playwright install chromium
npm run selftest                                                              # the fixtures, below
node run.mjs --dir ../../lectures/_build/html --base-path /test-lecture-theme-sphinx/   # a built site
node run.mjs --url https://quantecon.github.io/test-lecture-theme-sphinx/                # the live site
```

Both ways write `_harness/rendered.csv` and `_harness/provenance.json` at the repository root (`--out` to change it) and print the counts by check and result. A built site is served under the path the live site uses, `/test-lecture-theme-sphinx/`: some of this build's links are root-relative, and `download-notebook`'s answers 404 under the sub-path, so a site served at `/` would pass a check the live site fails. `--only id,id` runs those features alone, `--pages stem,stem` those pages, and `--no-pages` leaves out the page-wide checks.

The exit status: 0 when every check ran, whatever it found; 1 when a check could not run (an `error` row, which is still written); 2 when nothing was checked (a bad argument, a locator table that does not parse, a site that cannot be served or does not answer).

## What it checks

- **Every site feature** in `locators.yml`, on the page and at the viewport its entry names, in light and dark. `present`: does the locator match? `behaviour`: where the entry names one, the behaviour is exercised (`theme.mjs` and `lib/behave.mjs`, keyed by the feature id). Each check gets a fresh browser context, so nothing one check writes to `localStorage` reaches another, and on the live sites, which share the origin `quantecon.github.io`, nothing one site writes reaches the other's checks.
- **Every page** at desktop (1280), tablet (820) and phone (390), light and dark: `error-marker` (`mjx-merror`, `.katex-error`, mystmd's red KaTeX message, a title ending "Unknown Directive" or "Unknown Role", `.system-message`, `.problematic`), `console` (console errors, hydration warnings and uncaught errors on load) and `overflow` (`scrollWidth` beyond `clientWidth`, so the page scrolls sideways).

**The colour scheme.** quantecon-book-theme reads one thing: `localStorage.setContrast`, `'1'` for dark (`layout.html`). It never reads `prefers-color-scheme`, so emulating that would record a light page as dark. Each context starts with the key in its storage, and before any check runs, the harness confirms the scheme took effect (`body.dark-theme` in dark, not in light); a page where it did not gives `error` rows.

A check result is data: a failed feature check, a marker, a console message or an overflow is a row, not a failed job.

## rendered.csv

One row per check, with the columns of QuantEcon/project-theme-parity#15, the same in both corpora so their rows join:

| Column | Holds |
| --- | --- |
| `page` | the page's Sphinx name (`code_cells`), on both sites |
| `family` | the feature id, or `page` for the page-wide checks |
| `check` | `present`, `behaviour`, `error-marker`, `console` or `overflow` |
| `viewport` | `desktop` (1280), `wide` (1440), `tablet` (820) or `phone` (390) |
| `scheme` | `light` or `dark` |
| `result` | one of the six below |
| `detail` | the evidence: a count, what the behaviour did, a message, a URL and what it answered |

| Result | Means |
| --- | --- |
| `pass` | the check ran and held |
| `fail` | the check ran and did not hold: a behaviour failed, or a marker, console message or overflow was found |
| `absent` | `present` only: the locator matched nothing |
| `none` | no locator: this site has no counterpart (`null` in the table), on `present` and `behaviour` |
| `skip` | the check ran but could not decide; `detail` says why, and what a person has to look at instead |
| `error` | the check could not run: it threw, the page did not load, or the colour scheme did not take effect |

`present` counts every part of a locator, as `<matched> (<visible> visible)`, and the first part decides `pass` or `absent`. The rows come in a fixed order: the features in the table's order (light, then dark; `present`, then `behaviour`), then the pages in the site's order (`lectures/_toc.yml`).

## provenance.json

The repository and commit (`commit` is the pull request's head on a pull request; `checkout` the commit checked out), the workflow run, what was read (a built directory and the base path it was served at, or a URL) and the commit its `build_info` page prints, the locator table's source commit and its corrections, the pages, the viewports, how each scheme was set, the Playwright and browser versions, Node, and the UTC start and finish.

## The locator table

`locators.yml` is a copy of `bin/site-features.yml` in QuantEcon/project-theme-parity, each entry's `checks` and only this theme's side, at the commit its `source` names. Every locator was checked against this build before the copy; one that has moved on this site is corrected here, with a `corrected: {from, why}` note, and the correction is carried in `provenance.json`.

## The self-test

`selftest/good/` and `selftest/bad/` are small static sites in this theme's markup, checked with `selftest/locators.yml` through the same engine and `theme.mjs`, their rows compared with `selftest/expected-*.csv`. Between them every check type passes and fails and every result appears: a working dark-mode toggle and a broken one, a stderr fold that works and one that does not, a MathJax error marker, a console error, a page wider than every viewport, a null locator, a locator that matches nothing, a check that cannot decide and a missing page. CI runs it before the real run; a mismatch fails the job.

## Files

- `run.mjs` — the command; `theme.mjs` — this site's side: page addresses, the scheme, settling, its own behaviours
- `lib/` — the engine, the same in both corpora: `engine.mjs` (the run), `behave.mjs` (the behaviours both themes share), `markers.mjs`, `util.mjs`, `table.mjs` (reads and checks the table), `server.mjs` (a static server under a base path, after quantecon-theme.mystmd's `static-server.mjs`), `csv.mjs`
- `locators.yml`, `selftest/`, `package.json` and `package-lock.json` (`@playwright/test` and `yaml`, pinned)

`.github/workflows/harness.yml` runs it: on a pull request after the preview build (`ci.yml`), uploading `_harness/` as the run's `harness` artefact; on a push to `main` after the build (`publish.yml`), whose deploy job adds `_harness/` to the site when the checks succeeded and deploys without it when they did not.

## Not in this run

The families' drawn and text-present checks (they need each stack's layer-2 counts, from the private parity repository), metrics and crops (for the visual layer, QuantEcon/project-theme-parity#8), every feature at every viewport, and the rule that a drawn failure fails the job. The CSV leaves room for them: a family's rows will carry its family id and the checks `drawn` and `text`.
