# test-lecture-theme-sphinx

*A representative corpus of the MyST constructs the QuantEcon Python lecture series use, built with Jupyter Book 1 and `quantecon-book-theme` through the same composite actions a production lecture repository runs, in the build image that both corpora share. Its sibling, [`test-lecture-theme-mystmd`](https://github.com/QuantEcon/test-lecture-theme-mystmd), builds the same content on the mystmd stack; the two are compared feature by feature to check parity and to find styling improvements and regressions before the lectures cut over.*

Last updated: 2026-09-21

> **This is a test repository.** Nothing here is a lecture. Do not link to it from a lecture site.

## What is in the corpus

The pages under `lectures/` are organised by construct family. Each page opens with a comment naming the lectures its examples were taken from, and every count below comes from a scan of the eight lecture repositories on 2026-09-16 (`workspace-lectures`, `bin/feature-inventory`).

| Page | Family | Constructs |
| --- | --- | --- |
| `typography.md` | text and page structure | headings to h5, inline formatting, footnotes, lists, definition list, block quotes (including quoted display maths), pipe tables, `+++` block breaks, `%` and HTML comments, inline HTML (including the series' one `<style>` block and its one, commented-out, `<font>` element), `{only} html`/`latex`, `{index}` directive and role, `{contents}`, `{epigraph}` |
| `math.md` | mathematics | inline and display maths, numbers written as inline maths (bare, negative, with a numeric exponent, each beside the same value inside a formula), `$$ (label)` and `{math}` labels with `{eq}`, the environments in use (`aligned`, `bmatrix`, `pmatrix`, `matrix`, `array`, `cases`, `split`, `gathered`), bare `amsmath` environments (`align*`, `equation`, `align`, `equation*`), the theme-injected and config-defined macro sets, and five constructions MathJax tolerates but KaTeX rejects |
| `references.md` | cross-references | `(target)=`, `{ref}`, `{doc}`, `{numref}`, `{prf:ref}`, `{cite}`, `{cite:t}`, `{cite:p}`, `{download}`, `{any}`, footnotes, index roles |
| `code_cells.md` | executable cells | the four language names, every cell tag in use (`hide-input`, `hide-output`, `hide-cell`, `raises-exception`, `skip-execution`, `output_scroll`, `scroll-output`, `collapse-20`, and `no-execute`, which neither stack knows), `hide-output` written as a cell option, `:load:`, `:caption:`/`:lineno-start:`, stdout and stderr streams, DataFrame output, plotly, IPython magics and help, `{code-block}` and plain fences |
| `long_cells.md` | long inputs and outputs | the demonstration page for QuantEcon/project-theme-parity#19: one long input and one long output shown four ways (`collapse-20`, `scroll-input`, `scroll-output`, and the theme prototype's `collapse-output-20`), each cell captioned with its mechanism |
| `figures.md` | figures and images | `{figure}` with every option in use, `{image}`, `mystnb` figure and image metadata on code cells, `glue`/`{glue:figure}`, `{youtube}`, a `{raw} html` iframe, an `<img>` in an HTML-only block |
| `known_failures.md` | execution outcomes | a tagged error, a skipped cell, output on stderr, an untagged output longer than the scroll cap, wide and tall DataFrames, and last an **untagged** error, to show what each stack does with the cells after it. The page sets `execution_allow_errors` for itself: without it the `-W` build fails, which is the Sphinx stack's real answer |
| `admonitions.md` | admonitions | `note` (plain and named), `warning`, `tip`, `hint` (plain and dropdown), `seealso`, titled `{admonition}` with a class, the shared `{include} _admonition/gpu.md`, `{epigraph}`, nested admonitions, `{todo}` |
| `exercises.md` | sphinx-exercise | compact `{exercise}`/`{solution}` (folded and plain), titled exercises, gated `{exercise-start}`/`{exercise-end}` with code cells, gated solutions with `:class: dropdown` and `:label:`, `{hint}` inside an exercise, references to exercises |
| `proofs.md` | sphinx-proof | every `prf:*` kind in use (definition, example, theorem, proof, lemma, proposition, assumption, corollary, remark, property, algorithm), `{prf:ref}`, and the capitalised `{prf:Theorem}` |
| `lp_intro.md`, `troubleshooting.md` | real lectures | captured verbatim from `lecture-python-intro` by `bin/capture`, which records the source commit in `CAPTURES.yml` (the linear programming lecture carries 13 of the 36 display blocks that fail in KaTeX) |
| `mystmd_native.md` | mystmd-only | `lecture-wasm`'s convention: `:label:` on a code cell, embedded by `{figure} #label` with its own `:label:` and caption. **Not in `_toc.yml`, so this build never reads it** (the form is an error in Sphinx); it is kept here because the corpus is edited here, and the mystmd corpus lists it |
| `intro.md`, `status.md`, `zreferences.md` | the standard pages | `{tableofcontents}`, `{nb-exec-table}`, `{bibliography}` |
| `build_info.md` | build record | generated at build time by its own code cells: the engine, theme and library versions, the repository commit and (on the mystmd side) the derivation record, so the comparison harness knows what built the site it reads |

Every content page also starts the way a lecture does: a target label, the notebook logo header in a `{raw}` block (both the `html` and the `jupyter` form appear), the title and an `{index}` entry.

Deliberately not in the corpus because no lecture uses them: Markdown images (`![]()`), task lists, `{dropdown}`, `{tab-set}`, `{margin}`, `{sidebar}`, `{toctree}`, `{glossary}`, `{term}`, substitutions.

## Building

CI builds inside `ghcr.io/quantecon/quantecon-build`, pinned by digest in `.github/workflows/`: the same image the mystmd corpus uses, so the two corpora run one kernel (theme-parity decision D14), and `build_info` prints the digest. `environment.yml` pins the versions the lecture repositories pin, for a build outside the image:

```bash
pip install jupyter-book==1.0.4post1 quantecon-book-theme==0.22.0 sphinx-tojupyter==0.6.0 \
    sphinxext-rediraffe==0.3.0 sphinx-exercise==1.2.1 sphinx-proof==0.4.0 \
    sphinxcontrib-youtube==1.5.0 sphinx-togglebutton==0.4.5 sphinx-reredirects==1.1.0 \
    quantecon plotly
jb build lectures
open lectures/_build/html/index.html
```

Code cells execute (`execute_notebooks: cache`), so the build needs a Python kernel with `numpy`, `matplotlib`, `pandas`, `scipy`, `plotly` and `quantecon`. CI runs the same composite actions the lecture repositories run (`quantecon/actions@v0`, in the `quantecon-build` container); `publish.yml` deploys every push to `main` to GitHub Pages rather than waiting for a `publish*` tag, because the comparison harness reads the live site. It also publishes the engine's own output beside the site: the docutils XML of every page, at `/_xml/<page>.xml`, which the parity project's structural layer compares with mystmd's page AST. CI builds it after the HTML with `jb build lectures --path-output . --builder custom --custom-builder xml -W --keep-going` (the same `--path-output` as the HTML build, so it reuses the execution cache and runs nothing again) and copies `_build/xml/*.xml` into the HTML tree's `_xml/`. Locally, after `jb build lectures`, the same command without `--path-output .` writes `lectures/_build/xml/`.

## Relationship to other repositories

- **`test-lecture-theme-mystmd`** holds the same corpus for the mystmd stack. Its `lectures/` directory is *derived* from this one: the sync script there copies these sources at a pinned commit and applies the decided source rewrites (today, the theme's `rewrite-raw-blocks.mjs`). Edit content here; regenerate there.
- **`quantecon-book-theme-fixtures`** is the Sphinx theme's own visual-regression target: twelve small synthetic pages pinned by SHA in the theme's CI. This corpus is broader (it is measured against the lecture sources, and it executes code) and is not pinned by the theme; the two are complementary and the fixtures repo is unchanged by this one.
- **`project-theme-parity`** holds the parity project's tracker (QuantEcon/project-theme-parity#2), its decisions and the measurement passes that compare the two live sites; `workspace-themes` holds the plan that seeded it, and `workspace-lectures` the generator that produced the counts above.

## Adding to the corpus

Add a construct to the page of its family, with a comment naming the lecture and commit it came from, and keep it small enough to debug when it breaks. If it needs a static asset, put it under `_static/lecture_specific/<page>/`. Then regenerate the mystmd sibling and open one PR in each repository: this one first, because the sibling's `sync-check` re-derives from a commit on this repository's history.

Snippets are the rule. The two verbatim pages are never edited by hand: `bin/capture <lecture-python-intro checkout> [<commit>]` re-copies them and their static files from a named commit, writes the header under each page's frontmatter, and records `(repo, path, commit, date)` in `CAPTURES.yml`. It stops, and changes nothing, when a page refers to a file the source commit does not carry.

Which of the constructs the lectures use are present here is not recorded in this repository. Coverage is a property of an inventory version and a corpus version, so the parity project computes it in each measurement pass (`bin/coverage`, QuantEcon/project-theme-parity#7) and its [passes](https://github.com/QuantEcon/project-theme-parity/tree/main/passes) carry the report.

## Provenance and licence

The example text and code are adapted from the QuantEcon lectures, © Thomas J. Sargent and John Stachurski, under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); two pages are captured verbatim and say so at the top. The corpus itself is under the same licence.
