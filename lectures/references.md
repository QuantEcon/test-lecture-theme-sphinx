---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
kernelspec:
  display_name: Python 3
  language: python
  name: python3
---

(references-page)=
```{raw} html
<div id="qe-notebook-header" align="right" style="text-align:right;">
        <a href="https://quantecon.org/" title="quantecon.org">
                <img style="width:250px;display:inline;" width="250px" src="https://assets.quantecon.org/img/qe-menubar-logo.svg" alt="QuantEcon">
        </a>
</div>
```

# Cross-References and Citations

```{index} single: Test Corpus; References
```

% Patterns from lecture-python.myst (cite, cite:t), lecture-python-intro
% (numref, download), continuous_time_mcs (prf:ref) and
% lecture-python-programming (the {any} role).

## Targets and the `ref` role

A target `(references-page)=` precedes this page's header, as one does on 293
lecture files. The `{ref}` role reaches it in both forms: {ref}`references-page`
(the page title is used) and {ref}`the references page <references-page>`
(explicit text, the common form).

(a-section-target)=
## A section with its own target

Sections carry targets too: see {ref}`a-section-target` and
{ref}`this section <a-section-target>`.

## The `doc` role

The `{doc}` role links to another page by file name, plain -- {doc}`typography`
-- or with explicit text -- {doc}`the mathematics page <math>`. It is used
1,654 times across the series and is the form mystmd advises against.

## Numbered references

`{numref}` names a numbered figure: {numref}`fig-shortest-path` is a static
figure and {numref}`fig-random-walk` a figure produced by a code cell, both on
the {doc}`figures` page. Equations are referenced with `{eq}`, as in
{eq}`eq:cagan_demand`, and theorems and their kin with `{prf:ref}`, as in
{prf:ref}`thm-neumann` and {prf:ref}`def-markov-kernel`.

## Citations

Citations use `{cite}` (1,535 uses) with `author_year` reference style:
{cite}`russell2004history`, {cite}`north1989`. The textual form `{cite:t}`
(648 uses, two series) reads as a sentence element -- {cite:t}`keynes1940pay`
argued for compulsory saving -- and the parenthetical form `{cite:p}` is rare:
{cite:p}`bryant1984price`. Several keys in one role: {cite}`levitt2019did,Burns_2023`.
Every cited work is listed on the {doc}`zreferences` page by the
`{bibliography}` directive.

## Downloads

The `{download}` role offers a file from the repository:
{download}`the loaded helper script <_static/lecture_specific/code/loaded_script.py>`.

## The `any` role

Three uses in one series (and its translations) reach a label with the
`{any}` role: {any}`the typography page <typography>`. mystmd reports it as an
unknown role.

## Footnotes

A cross-reference page also carries footnotes[^ref-fn], since the two are
often confused in a rendering check.

[^ref-fn]: The footnote body, with a citation inside it: {cite}`kuznets1939incomes`.

## Index roles

Index roles also appear in running text: {index}`Bellman equation <single: Bellman equation>`.
