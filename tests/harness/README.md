# tests/harness — the rendered checks

*Playwright, run against this corpus's own build, checking the site features of the theme-parity harness (QuantEcon/project-theme-parity#15, D9) and every page for error markers, console errors and sideways scrolling; it writes `rendered.csv` and `provenance.json`, which CI publishes at `/_harness/`.*

Last updated: 2026-11-26

This is layer 3 of the parity harness, the Sphinx side of QuantEcon/test-lecture-theme-sphinx#3. Its twin in QuantEcon/test-lecture-theme-mystmd checks the mystmd site with the same engine and writes the same CSV, and QuantEcon/project-theme-parity folds the two files into a pass. The parity repository is private, so the checks live here, where this repository's CI can run them on the build it just made.

## Running it

```bash
cd tests/harness && npm ci && npx playwright install chromium
npm run selftest                                                              # the fixtures, below
node run.mjs --dir ../../lectures/_build/html --base-path /test-lecture-theme-sphinx/   # a built site
node run.mjs --url https://quantecon.github.io/test-lecture-theme-sphinx/                # the live site
```

Both ways write `_harness/rendered.csv` and `_harness/provenance.json` at the repository root (`--out` to change it) and print the counts by check and result. A built site is served under the path the live site uses, `/test-lecture-theme-sphinx/`: some of this build's links are root-relative, and `download-notebook`'s answers 404 under the sub-path, so a site served at `/` would pass a check the live site fails. `--only id,id` runs those features alone, `--pages stem,stem` gives the page-wide checks those pages only (the behaviours still read the whole site's order), and `--no-pages` leaves out the page-wide checks.

The exit status: 0 when every check ran, whatever it found; 1 when a check could not run (an `error` row, which is still written); 2 when nothing was checked (a bad argument, a locator table that does not parse, a site that cannot be served or does not answer, or a build made for another base: its home page's canonical link, or an asset it asks for, puts it somewhere other than the base it was given).

## What it checks

- **Every site feature** in `locators.yml`, on the page and at the viewport its entry names, in light and dark. `present`: does the locator match? `behaviour`: where the entry names one, the behaviour is exercised (`theme.mjs` and `lib/behave.mjs`, keyed by the feature id). Each check gets a fresh browser context, so nothing one check writes to `localStorage` reaches another, and on the live sites, which share the origin `quantecon.github.io`, nothing one site writes reaches the other's checks.
- **Every page** at desktop (1280), tablet (820) and phone (390), light and dark: `error-marker` (`mjx-merror`, `.katex-error`, mystmd's red KaTeX message, MathJax's red undefined macro, mystmd's yellow message for inline maths that failed, maths left as raw TeX, the "… - Unknown Directive" title mystmd gives an unknown directive's box, `.system-message`, `.problematic`; mystmd renders an unknown role as its plain text, which no marker can see), `console` (console errors, hydration warnings and uncaught errors on load) and `overflow` (`scrollWidth` beyond `clientWidth`, so the page scrolls sideways).

**The colour scheme.** quantecon-book-theme reads one thing: `localStorage.setContrast`, `'1'` for dark (`layout.html`). It never reads `prefers-color-scheme`, so emulating that would record a light page as dark. Each context starts with the key in its storage, and before any check runs, the harness confirms the scheme took effect (`body.dark-theme` in dark, not in light); a page where it did not gives `error` rows.

**The maths markers.** MathJax typesets this site's maths in the browser, and two of its failures leave no `mjx-merror`. An undefined macro is typeset by MathJax's `noundefined` package as its name in red: the marker reads the `<mtext mathcolor="red">` in the assistive MathML (or, where MathJax writes none, the red `mjx-mtext` whose first glyph is a backslash) and names the macro. Maths that never rendered keeps the delimiters Sphinx writes round each expression (`\(…\)`, `\[…\]`, or a bare `\begin{…}` for `amsmath`), which MathJax removes as it typesets each one, so TeX left with its delimiters in the page's text, outside code, is maths MathJax never rendered: every expression on the page when its CDN fails, where before only the `console` row saw the failed load. The detail gives how many expressions did render and whether MathJax loaded. On the mystmd site KaTeX renders at build: an undefined macro there is a parse error, shown as mystmd's red message in display maths and its yellow one inline, and raw TeX is TeX the parser did not take as maths.

A check result is data: a failed feature check, a marker, a console message or an overflow is a row, not a failed job. So is a control a behaviour has to operate and cannot, because it is not shown or will not take the click: that is `fail`, with the control named, where a behaviour that throws for any other reason is `error`. Links are fetched from the browser's context, each URL once a run. A link that answers with a failure (a 404, say), or a target that names the wrong file, makes its check `fail`; only when nothing failed does a link that gets no answer (no connection, a 429 rate limit or a 5xx, after two more tries) leave the check `skip`, for a person. Each behaviour has one time budget, 100 s inside its 120 s limit, and its retries stop before the budget runs out, so a slow or rate-limiting host gives `skip`, not `error`. The checks that read the clipboard take turns, since the browser has one clipboard, and each puts a marker on it and reads it back before pressing, so a button that copies nothing cannot pass on text another check left there; when the marker is not there to read back (the write failed), nothing is pressed and the check is `skip`: the clipboard could not be primed, and a person checks it.

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

`present` counts every part of a locator, as `<matched> (<visible> visible)`, and the first part decides `pass` or `absent`: the locator matching, as the parity harness's rule reads it. Whether the match is shown is in the detail, not the result, since a head element (the canonical link, the favicon, `rel="prev"`) is never shown and some controls show only on hover or scroll; a control a behaviour needs and cannot find shown fails that behaviour. The rows come in a fixed order: the features in the table's order (light, then dark; `present`, then `behaviour`), then the pages in the site's order (`lectures/_toc.yml`).

## provenance.json

The repository and commit (`commit` is the pull request's head on a pull request; `checkout` the commit checked out), the workflow run, what was read (a built directory and the base path it was served at, or a URL) and the commit its `build_info` page prints, the locator table's source commit and its corrections, the pages, the viewports, how each scheme was set, the Playwright and browser versions, Node, and the UTC start and finish.

## The locator table

`locators.yml` is a copy of `bin/site-features.yml` in QuantEcon/project-theme-parity, each entry's `checks` and only this theme's side, at the commit its `source` names. Every locator was checked against this build before the copy; one that has moved on this site is corrected here, with a `corrected: {from, why}` note, and the correction is carried in `provenance.json`.

## The self-test

`selftest/good/` and `selftest/bad/` are small static sites in this theme's markup, checked with `selftest/locators.yml` through the same engine and `theme.mjs`, their rows compared with `selftest/expected-*.csv`. Each is built twice, for `/test-lecture-theme-sphinx/` and for `/` (the base a mystmd pull request's build is made for): copied with every `{{base}}` replaced by the base, as a build writes its base into its canonical links, and served at that base, so `page-meta` and every other check that reads the base is read at both, against the same expected rows. Between them every check type passes and fails and every result appears: a working dark-mode toggle and a broken one, a stderr fold that works and one that does not, a copy button that copies the cell and one that copies nothing, a clipboard the harness cannot prime (the bad page refuses clipboard writes in dark, so its copy check is `skip`), a page whose canonical link, `og:url` and meta tags are right and one where they are not, a MathJax error marker, an undefined macro in red, a maths page whose MathJax did not load (raw TeX, with the failed load on the `console` row) and one where it rendered, the "Unknown Directive" text, a console error and a hydration warning, a page wider than every viewport, a null locator, a locator that matches nothing, a check that cannot decide, a behaviour that throws (given a locator without the part it presses), a feature at the `wide` viewport, a missing page, and a page whose dark scheme does not take effect. Then `run.mjs` itself runs on each build of the good site: at the base it was built for it checks it, and at the other its build-base check stops it with exit 2. CI runs the self-test before the real run; a mismatch fails the job, and in GitHub Actions each site's mismatches are also an `::error::` annotation on the run.

## Files

- `run.mjs` — the command; `theme.mjs` — this site's side: page addresses, the scheme, settling, its own behaviours
- `lib/` — the engine, the same in both corpora: `engine.mjs` (the run), `behave.mjs` (the behaviours both themes share), `markers.mjs`, `util.mjs`, `table.mjs` (reads and checks the table), `server.mjs` (a static server under a base path, after quantecon-theme.mystmd's `static-server.mjs`), `csv.mjs`
- `locators.yml`, `selftest/`, `package.json` and `package-lock.json` (`@playwright/test` and `yaml`, pinned)

`.github/workflows/harness.yml` runs it: on a pull request after the preview build (`ci.yml`), uploading `_harness/` as the run's `harness` artefact; on a push to `main` after the build (`publish.yml`), whose deploy job adds `_harness/` to the site when the checks succeeded and deploys without it when they did not. A run cancelled while the checks ran deploys nothing. Its first step checks that the shared engine (`lib/`, `run.mjs`, `selftest/run.mjs`, the package files but for their names, and `harness.yml` itself) matches the twin corpus's: on a pull request, the twin's branch of the same name when there is one, else its `main`, and a difference fails the job; on a push it only warns, since one half of a two-corpus change always merges first. So a change to the engine is made in both corpora, on one branch name.

## Not in this run

The families' drawn and text-present checks (they need each stack's layer-2 counts, from the private parity repository), metrics and crops (for the visual layer, QuantEcon/project-theme-parity#8), every feature at every viewport, and the rule that a drawn failure fails the job. The CSV leaves room for them: a family's rows will carry its family id and the checks `drawn` and `text`.
