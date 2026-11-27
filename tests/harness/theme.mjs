// What is particular to this site, quantecon-book-theme on Jupyter Book 1: how a page is addressed, how a colour
// scheme is set and checked, when a page has settled, and the behaviours whose markup is this theme's own. The
// engine (lib/) is the same in both corpora; this file is the Sphinx side of the contract.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import YAML from "yaml";
import { SiteFault, press, settleBase, oneLine, said, sleep } from "./lib/util.mjs";
import { MARKER_NAMES, errorMarkers } from "./lib/markers.mjs";
import * as B from "./lib/behave.mjs";
const { pass, fail, skip, yes } = B;

/** A page's stem from a link on this site: `code_cells.html#x` -> `code_cells`. */
function stemOf(href, base) {
  const last = new URL(href, base).pathname.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/\.html$/, "");
}

// The content root, `main.qe-page__content`: the lecture text, the drawn selectors' scope, and the metrics' (D19).
// The body text: a paragraph of running text, directly in a section and in no box. `para` takes every paragraph of
// the text, boxed ones too (an exercise's, a proof's: on `admonitions` and `exercises` the commonest paragraph is a
// boxed one), so it serves the behaviours that press on the text, and `body` is the metrics' reference for size and
// column, and dark-palette's text. One proof dropdown is drawn without `.admonition`, hence `.proof` too.
const profile = {
  text: "main.qe-page__content", // the lecture text
  para: ".qe-page__content p",
  body: "section > p:not(.admonition *):not(.proof *)", // inside `text`
  stemOf,
  maths: { all: "mjx-container", menu: ".CtxtMenu_Menu", item: ".CtxtMenu_MenuItem" },
};

/**
 * Where a surface's pairing key sits on this theme (lib/visual.mjs normalises and hashes it; decision 3 of
 * QuantEcon/project-theme-parity#80). Runs in the page, on a shown surface, with the content root. Each is there only
 * where the surface has it: `tex`, a display maths element's TeX, from MathJax's math list (MathJax removes the TeX
 * from the page as it typesets, and keeps it on each MathItem with the element it typeset); `code`, the input of
 * the cell the surface is or lies in, or of the code block it is or lies in; `heading`, a heading's text without its
 * section number or permalink; `label`, the nearest id at or above the surface, below its section, that docutils did
 * not generate (`id1`, `id2`, …: those name no label).
 */
function sourceOf(e, root) {
  const out = {};
  if (e.matches("mjx-container")) {
    for (const item of window.MathJax?.startup?.document?.math ?? []) if (item.typesetRoot === e) { out.tex = String(item.math); break; }
  }
  const cell = e.closest("div.cell");
  const code = cell ? cell.querySelector(".cell_input pre") : e.closest('div[class*="highlight-"]')?.querySelector("pre");
  if (code) out.code = code.textContent;
  if (/^H[1-6]$/.test(e.tagName)) {
    const h = e.cloneNode(true);
    for (const x of h.querySelectorAll("a.headerlink, span.section-number")) x.remove();
    out.heading = h.textContent;
  }
  for (let x = e; x && x !== root && x.tagName !== "SECTION"; x = x.parentElement) {
    if (x.id && !/^id\d+$/.test(x.id)) { out.label = x.id; break; }
  }
  return out;
}

const behaviours = {
  ...B.commonBehaviours(profile),

  async launch(c) {
    const { page } = c;
    await press(c.part(), "the launch control");
    await page.locator("#settingsModal").waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    const t = await page.evaluate(() => {
      const m = document.querySelector("#settingsModal");
      const vis = !!m && getComputedStyle(m).display !== "none";
      const opts = [...document.querySelectorAll("#launcher-public-input option")].map((o) => ({ label: `public, ${o.textContent.trim()}`, url: o.value }));
      const btn = document.querySelector("#advancedLaunchButton");
      const p = document.querySelector("#launcher-private-input");
      return { vis, opts, button: btn?.href ?? null, priv: p ? { repo: p.dataset.repourl, path: p.dataset.urlpath, branch: p.dataset.branch } : null };
    });
    if (!t.vis) return fail("the control opened nothing");
    const targets = [...t.opts];
    if (t.button && !targets.some((o) => o.url === t.button)) targets.push({ label: "the Launch Notebook link", url: t.button });
    if (t.priv) {
      // the private launcher opens the notebook on a JupyterHub the reader names, pulled from this repository
      const file = t.priv.path.split("/").slice(2).join("/");
      targets.push({ label: "private, a JupyterHub the reader names", url: `${t.priv.repo}/blob/${t.priv.branch}/${file}` });
    }
    return B.launchTargets(c, targets);
  },

  async "download-notebook"(c) {
    return B.downloadLinks(c, await c.part().evaluateAll((as) => as.map((a) => a.getAttribute("href"))));
  },

  async "download-pdf"(c) {
    // headless Chromium has no print dialog: count the calls to window.print() the control makes
    await c.page.evaluate(() => { window.__harnessPrints = 0; window.print = () => { window.__harnessPrints++; }; });
    await press(c.part(), "the Download PDF control");
    await sleep(400);
    const n = await c.page.evaluate(() => window.__harnessPrints);
    return n ? pass("activating it calls window.print(), which opens the print dialog (counted here: headless Chromium has no dialog)") : fail("activating it did not call window.print()");
  },

  async search(c) {
    const { page } = c;
    await press(c.part("control"), "the search control");
    const input = c.part("input").first();
    await input.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (!(await input.isVisible())) return fail("the search control showed no input");
    await input.fill("Cagan");
    await Promise.all([
      page.waitForNavigation({ timeout: 30_000 }).catch(() => { throw new SiteFault("Enter in the search box opened no results page in 30 s"); }),
      input.press("Enter"),
    ]);
    await page.locator("ul.search li a").first().waitFor({ timeout: 30_000 }).catch(() => {});
    await sleep(500);
    const hrefs = await page.locator("ul.search li a").evaluateAll((as) => as.map((a) => a.href));
    const hits = hrefs.filter((h) => stemOf(h, page.url()) === "math");
    const detail = `"Cagan" on ${page.url().replace(/^https?:\/\/[^/]+/, "")}: ${hrefs.length} result link(s), ${hits.length} to the maths page`;
    return hits.length ? pass(detail) : fail(detail);
  },

  async "mobile-navigation"(c) {
    const { page } = c;
    const actions = await page.evaluate(() => {
      const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (e.checkVisibility ? e.checkVisibility({ visibilityProperty: true }) : getComputedStyle(e).visibility !== "hidden"); };
      return [...document.querySelectorAll(".qe-toolbar li")].filter(vis).map((li) =>
        li.getAttribute("data-tippy-content") || li.querySelector("[data-tippy-content]")?.getAttribute("data-tippy-content")
        || li.querySelector("[aria-label]")?.getAttribute("aria-label") || li.textContent.trim() || li.className || "?");
    });
    await press(c.part("contents"), "the contents control");
    await sleep(800);
    const opened = await page.evaluate(() => { const s = document.querySelector("#site-navigation"); if (!s) return false; const r = s.getBoundingClientRect(); return r.width > 0 && r.right > 0 && (s.checkVisibility ? s.checkVisibility({ visibilityProperty: true }) : getComputedStyle(s).visibility !== "hidden") && !s.classList.contains("inactive"); });
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    const detail = `visible in the toolbar: ${actions.join(", ")}; nothing in a menu; the contents drawer opens: ${yes(opened)}; the page ${o.sw > o.cw ? `scrolls sideways (scrollWidth ${o.sw} > clientWidth ${o.cw})` : `fits (scrollWidth ${o.sw})`}`;
    const result = opened && o.sw <= o.cw ? pass : fail;
    // the result is the drawer and the width; whether every action the Sphinx site offers at 390px is reachable is a
    // comparison of the two sites' lists, for a person
    return result(`${detail}. The drawer and the width decide this row; a person compares the action lists with the other site's`);
  },

  async "contents-drawer"(c) {
    const { page } = c;
    await press(c.part("toggle"), "the contents toggle");
    await sleep(900);
    const entries = await c.part("entries").evaluateAll((as) => as
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (e.checkVisibility ? e.checkVisibility({ visibilityProperty: true }) : getComputedStyle(e).visibility !== "hidden"); })
      .map((a) => a.getAttribute("href")));
    const want = c.site.pages.filter((x) => x !== c.site.pages[0]);
    const listed = entries.map((h) => stemOf(h, page.url())).filter((s) => s !== c.site.pages[0]);
    const inOrder = JSON.stringify(listed) === JSON.stringify(want);
    const current = await c.part("current").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const marked = current.length === 1 && stemOf(current[0], page.url()) === c.feature.page;
    await page.setViewportSize({ width: 1024, height: 800 });
    await sleep(900);
    const ov = await B.overlap(page, "#site-navigation", profile.text);
    const clear = ov.area === 0;
    const detail = `${entries.length} entries${inOrder ? ", every page in the site's order" : `; expected ${want.join(", ")}; listed ${listed.join(", ")}`}; `
      + `the current page marked: ${marked ? "yes" : `no (${current.join(", ") || "none"})`}; at 1024px the open drawer ${ov.area == null ? `is not shown (drawer ${yes(ov.a)}, text ${yes(ov.b)})` : clear ? "leaves the text clear" : `covers ${ov.area}px² of the text (drawer ${ov.aBox.join("-")}, text ${ov.bBox.join("-")})`}`;
    return inOrder && marked && clear ? pass(detail) : fail(detail);
  },

  async "outline-copy-link"(c) {
    const { page } = c;
    const btn = c.part().first();
    const want = await btn.evaluate((b) => b.closest("a")?.href ?? null);
    const entry = btn.locator("xpath=ancestor::a[1]");
    if (!(await entry.isVisible())) throw new SiteFault("the outline entry that holds the copy link is not shown");
    await entry.scrollIntoViewIfNeeded();
    await entry.hover();
    await sleep(400);
    // the icon's span is 0px wide (its svg overflows it), so the reader's click lands on the svg; if a real click
    // cannot land, a reader cannot copy the link either
    const copied = await B.copyWith(page, () => press(btn.locator("svg"), "the copy icon"));
    if (!copied.primed) return B.unprimed(copied);
    const { text: clip, untouched } = copied;
    const detail = `clicked the icon: the clipboard ${untouched ? "still holds the harness's marker, so the icon copied nothing" : `holds "${oneLine(clip, 160)}"`}; the entry's section is ${want}`;
    return clip === want ? pass(detail) : fail(detail);
  },

  async authors(c) {
    const links = await c.part().evaluateAll((as) => as.map((a) => ({ name: a.textContent.trim(), href: a.href })));
    const res = await B.fetchAll(c, links.map((l) => l.href));
    return B.verdictOf(links.map((l, i) => `${l.name}: ${res[i].said}`).join("; "), res, { good: (r) => r.ok });
  },

  async "notebook-header"(c) {
    const link = c.page.locator('li[data-tippy-content="Download Notebook"] a[download]').first();
    const href = (await link.count()) ? await link.getAttribute("href") : null;
    if (!href) return skip("the page offers no notebook download, so there is no notebook to read; a person compares the two stacks' notebooks");
    const u = new URL(href, c.page.url()).href;
    const r = await c.fetch(u, { body: true });
    if (r.status !== 200) return skip(`the page's notebook link "${href}" resolves to ${said(u, r)}, so there is no downloaded notebook to read; a person compares the two stacks' notebooks`);
    let first = "(not a notebook)";
    try { const nb = JSON.parse(r.body); const cell = nb.cells?.[0]; first = cell ? `${cell.cell_type}: "${oneLine([].concat(cell.source).join(""), 140)}"` : "(no cells)"; } catch {}
    return skip(`the downloaded notebook's first cell is ${first}. Whether it is this feature's parity is the owner's verdict (QuantEcon/quantecon-theme.mystmd#204)`);
  },

  async "code-copy"(c) {
    const { page } = c;
    const btn = c.part().first();
    const want = await btn.evaluate((b) => b.closest("div.highlight")?.querySelector("pre")?.innerText ?? null);
    await btn.evaluate((b) => b.closest("div.highlight")?.scrollIntoView({ block: "center" }));
    await btn.locator("xpath=..").hover().catch(() => {});
    await sleep(300);
    const copied = await B.copyWith(page, () => press(btn, "the copy button"));
    if (!copied.primed) return B.unprimed(copied);
    const { text: clip, untouched } = copied;
    const norm = (s) => (s ?? "").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").trim();
    const ok = want != null && !untouched && norm(clip) === norm(want);
    return { result: ok ? "pass" : "fail", detail: untouched ? "pressed on the first code block: the clipboard still holds the harness's marker, so the button copied nothing"
      : `pressed on the first code block: the clipboard holds ${norm(clip).length} characters ("${oneLine(clip, 60)}"), ${ok ? "its source" : `not its source (${norm(want).length} characters, "${oneLine(want, 60)}")`}` };
  },

  async "long-input"(c) {
    const bar = await c.part().first().elementHandle();
    const block = await bar.evaluateHandle((b) => b.closest("div.cell").querySelector(".highlight"));
    return B.collapseFlow(c, block, bar);
  },

  async "long-output"(c) {
    const m = await c.part().first().evaluate((e) => {
      const cs = getComputedStyle(e);
      return { ch: e.clientHeight, sh: e.scrollHeight, oy: cs.overflowY, max: cs.maxHeight, fs: parseFloat(cs.fontSize) };
    });
    const em = m.max.endsWith("px") ? `${(parseFloat(m.max) / m.fs).toFixed(1)} em` : m.max;
    const capped = m.sh > m.ch + 2 && ["auto", "scroll"].includes(m.oy);
    const detail = `${m.ch}px shown of ${m.sh}px; overflow-y ${m.oy}; max-height ${m.max} (${em}): ${capped ? "capped, with a scrollbar" : "not capped"}`;
    return capped ? pass(detail) : fail(detail);
  },

  async "stderr-fold"(c) {
    const btn = c.part().first();
    const content = btn.locator("xpath=..").locator(".stderr-content").first();
    const before = await content.isVisible();
    await press(btn, "the stderr toggle");
    await sleep(700);
    const after = await content.isVisible();
    const detail = `the stderr text on load: ${before ? "shown" : "hidden"}; after the toggle: ${after ? "shown" : "hidden"}`;
    return !before && after ? pass(detail) : fail(detail);
  },

  async "output-images"(c) {
    const gaps = await c.part().evaluateAll((imgs) => imgs.map((img) => {
      const r = img.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0 && (img.checkVisibility ? img.checkVisibility({ visibilityProperty: true }) : getComputedStyle(img).visibility !== "hidden"))) return null;
      const k = (img.closest("div.cell_output") ?? img.parentElement).getBoundingClientRect();
      return { l: Math.round(r.left - k.left), r: Math.round(k.right - r.right), w: Math.round(r.width) };
    }).filter(Boolean));
    if (!gaps.length) return skip("no output image is shown on load; a person looks at the figures page");
    const off = gaps.filter((g) => Math.abs(g.l - g.r) > 1);
    const detail = `${gaps.length} shown, each in its output: ${gaps.map((g) => `${g.w}px wide, ${g.l}px | ${g.r}px`).join("; ")}`;
    return off.length ? fail(`${off.length} not centred; ${detail}`) : pass(`all centred; ${detail}`);
  },
};
behaviours["notebook-header"].withoutLocator = true;

export default {
  side: "sphinx",
  // the metrics' theme facts (D19): the content root, the body text inside it, and where a surface's key sits
  content: profile.text,
  bodyText: profile.body,
  sourceOf,
  repository: "QuantEcon/test-lecture-theme-sphinx",
  basePath: "/test-lecture-theme-sphinx/",
  publishedBase: "https://quantecon.github.io/test-lecture-theme-sphinx/",
  buildInfoPage: "build_info",
  homeFiles: ["intro.html"],
  escapesBase: () => false,
  baseWhy: (base) => `the path the live site is served under (${base}): some of this build's links are root-relative, `
    + "and a site served at / would answer links that 404 on the live site (download-notebook)",

  /** The site's pages, in its order: lectures/_toc.yml's root, then every chapter. */
  async pages(repo) {
    const toc = YAML.parse(await readFile(join(repo, "lectures", "_toc.yml"), "utf8"));
    const out = [toc.root];
    const walk = (items) => { for (const it of items ?? []) { if (it.file) out.push(it.file.replace(/\.(md|ipynb)$/, "")); walk(it.sections); } };
    for (const part of toc.parts ?? [{ chapters: toc.chapters }]) walk(part.chapters);
    return out;
  },

  pagePath: (stem) => `${stem}.html`,

  // quantecon-book-theme reads one thing for its scheme: localStorage.setContrast, '1' for dark (layout.html and
  // theme-settings.js); it never reads prefers-color-scheme. Each context starts with the key in its storage.
  schemeHow: {
    light: "localStorage setContrast = '0', in the browser context's storage before the first load; prefers-color-scheme not emulated (the theme does not read it). Checked before every check: body has no dark-theme class",
    dark: "localStorage setContrast = '1', in the browser context's storage before the first load; prefers-color-scheme not emulated (the theme does not read it). Checked before every check: body.dark-theme",
  },
  contextOptions: (scheme, origin) => ({
    storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: "setContrast", value: scheme === "dark" ? "1" : "0" }] }] },
  }),
  async verifyScheme(page, scheme) {
    const dark = await page.evaluate(() => document.body.classList.contains("dark-theme"));
    return { ok: dark === (scheme === "dark"), detail: `body.dark-theme is ${dark ? "set" : "not set"}` };
  },

  async settle(page) {
    await settleBase(page);
    await page.evaluate(() => (window.MathJax?.startup?.promise ?? Promise.resolve()).then(() => true)).catch(() => {});
  },

  markerNames: MARKER_NAMES,
  errorMarkers,
  behaviours,
};
