# test-lecture-theme-sphinx

*A representative corpus of the MyST constructs the QuantEcon Python lecture series use, built with Jupyter Book 1 and `quantecon-book-theme` exactly as a production lecture repository builds. Its sibling, [`test-lecture-theme-mystmd`](https://github.com/QuantEcon/test-lecture-theme-mystmd), builds the same content on the mystmd stack; the two are compared feature by feature to check parity and to find styling improvements and regressions before the lectures cut over.*

Last updated: 2026-09-16

> **This is a test repository.** Nothing here is a lecture. Do not link to it from a lecture site.

## What is in the corpus

The pages under `lectures/` are organised by construct family. Each page opens with a comment naming the lectures its examples were taken from, and every count below comes from a scan of the eight lecture repositories on 2026-09-16 (`workspace-lectures`, `bin/feature-inventory`).

| Page | Family | Constructs |
| --- | --- | --- |
| `typography.md` | text and page structure | headings to h5, inline formatting, footnotes, lists, definition list, block quotes (including quoted display maths), pipe tables, `+++` block breaks, `%` and HTML comments, inline HTML, `{only} html`/`latex`, `{index}` directive and role, `{contents}`, `{epigraph}` |
| `math.md` | mathematics | inline and display maths, `$$ (label)` and `{math}` labels with `{eq}`, the environments in use (`aligned`, `bmatrix`, `pmatrix`, `matrix`, `array`, `cases`, `split`), bare `amsmath` environments, the theme-injected and config-defined macro sets, and five constructions MathJax tolerates but KaTeX rejects |
| `references.md` | cross-references | `(target)=`, `{ref}`, `{doc}`, `{numref}`, `{prf:ref}`, `{cite}`, `{cite:t}`, `{cite:p}`, `{download}`, `{any}`, footnotes, index roles |
| `code_cells.md` | executable cells | the four language names, every cell tag in use (`hide-input`, `hide-output`, `hide-cell`, `raises-exception`, `skip-execution`, `output_scroll`, `scroll-output`, `collapse-20`), `:load:`, `:caption:`/`:lineno-start:`, stdout and stderr streams, DataFrame output, plotly, IPython magics and help, `{code-block}` and plain fences |
| `figures.md` | figures and images | `{figure}` with every option in use, `{image}`, `mystnb` figure and image metadata on code cells, `glue`/`{glue:figure}`, `{youtube}`, a `{raw} html` iframe, an `<img>` in an HTML-only block |
| `admonitions.md` | admonitions | `note` (plain and named), `warning`, `tip`, `hint` (plain and dropdown), `seealso`, titled `{admonition}` with a class, the shared `{include} _admonition/gpu.md`, `{epigraph}`, nested admonitions, `{todo}` |
| `exercises.md` | sphinx-exercise | compact `{exercise}`/`{solution}` (folded and plain), titled exercises, gated `{exercise-start}`/`{exercise-end}` with code cells, gated solutions with `:class: dropdown` and `:label:`, `{hint}` inside an exercise, references to exercises |
| `proofs.md` | sphinx-proof | every `prf:*` kind in use (definition, example, theorem, proof, lemma, proposition, assumption, corollary, remark, property, algorithm), `{prf:ref}`, and the capitalised `{prf:Theorem}` |
| `lp_intro.md`, `troubleshooting.md` | real lectures | captured verbatim from `lecture-python-intro` (the linear programming lecture carries 13 of the 36 display blocks that fail in KaTeX) |
| `intro.md`, `status.md`, `zreferences.md` | the standard pages | `{tableofcontents}`, `{nb-exec-table}`, `{bibliography}` |

Every content page also starts the way a lecture does: a target label, the notebook logo header in a `{raw}` block (both the `html` and the `jupyter` form appear), the title and an `{index}` entry.

Deliberately not in the corpus because no lecture uses them: Markdown images (`![]()`), task lists, `{dropdown}`, `{tab-set}`, `{margin}`, `{sidebar}`, `{toctree}`, `{glossary}`, `{term}`, substitutions.

## Building

The build environment is the production one (`environment.yml` pins the same versions the lecture repositories pin):

```bash
pip install jupyter-book==1.0.4post1 quantecon-book-theme==0.22.0 sphinx-tojupyter==0.6.0 \
    sphinxext-rediraffe==0.3.0 sphinx-exercise==1.2.1 sphinx-proof==0.4.0 \
    sphinxcontrib-youtube==1.5.0 sphinx-togglebutton==0.4.5 sphinx-reredirects==1.1.0 \
    quantecon plotly
jb build lectures
open lectures/_build/html/index.html
```

Code cells execute (`execute_notebooks: cache`), so the build needs a Python kernel with `numpy`, `matplotlib`, `pandas`, `scipy`, `plotly` and `quantecon`. CI runs the same composite actions the lecture repositories run (`quantecon/actions@v0`, in the `quantecon-build` container); `publish.yml` deploys every push to `main` to GitHub Pages rather than waiting for a `publish*` tag, because the comparison harness reads the live site.

## Relationship to other repositories

- **`test-lecture-theme-mystmd`** holds the same corpus for the mystmd stack. Its `lectures/` directory is *derived* from this one: the sync script there copies these sources at a pinned commit and applies the decided source rewrites (today, the theme's `rewrite-raw-blocks.mjs`). Edit content here; regenerate there.
- **`quantecon-book-theme-fixtures`** is the Sphinx theme's own visual-regression target: twelve small synthetic pages pinned by SHA in the theme's CI. This corpus is broader (it is measured against the lecture sources, and it executes code) and is not pinned by the theme; the two are complementary and the fixtures repo is unchanged by this one.
- **`workspace-themes`** holds the parity project's tracker and plan; `workspace-lectures` holds the generator that produced the counts above.

## Adding to the corpus

Add a construct to the page of its family, with a comment naming the lecture it came from, and keep it small enough to debug when it breaks. If it needs a static asset, put it under `_static/lecture_specific/<page>/`. Then regenerate the mystmd sibling and open one PR in each repository.

## Provenance and licence

The example text and code are adapted from the QuantEcon lectures, © Thomas J. Sargent and John Stachurski, under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); two pages are captured verbatim and say so at the top. The corpus itself is under the same licence.
