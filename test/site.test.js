"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const CONTENT = path.join(SRC, "content");
const DIST = path.join(ROOT, "dist");

function log(msg) {
  process.stdout.write("    · " + msg + "\n");
}

function run(cmd, args) {
  return execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
}

function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
}

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    return d.isDirectory()
      ? walk(full, base)
      : [path.relative(base, full).split(path.sep).join("/")];
  });
}

function allPagePaths(manifest) {
  return manifest.topics.flatMap((t) => t.pages.map((p) => p.path));
}

function distHtmlFiles() {
  return walk(DIST).filter((f) => f.endsWith(".html"));
}

function idsIn(html) {
  const ids = new Set();
  const re = /\sid="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.add(m[1]);
  return ids;
}

function hrefsIn(html) {
  const out = [];
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

// A failing check reports EVERY problem it found, not just the first.
function assertNoProblems(label, problems) {
  if (problems.length) {
    const body = problems.map((p, i) => `  ${i + 1}. ${p}`).join("\n");
    assert.fail(`${label} — ${problems.length} problem(s):\n${body}`);
  }
  log(`${label}: OK`);
}

const MANIFEST = readManifest();

test("site builds cleanly (node build.js)", () => {
  try {
    const out = run("node", ["build.js"]);
    out
      .split("\n")
      .filter(Boolean)
      .forEach((l) => log(l));
  } catch (e) {
    assert.fail("build.js failed:\n" + (e.stdout || "") + (e.stderr || ""));
  }
});

test("manifest.json is well-formed", () => {
  const problems = [];
  if (!Array.isArray(MANIFEST.topics)) problems.push('missing "topics" array');
  const slug = /^[a-z0-9]+(?:\/[a-z0-9][a-z0-9-]*)+$/;
  const seenPaths = new Set();
  const seenTopics = new Set();

  for (const topic of MANIFEST.topics || []) {
    if (!topic.name) problems.push("a topic has no name");
    if (seenTopics.has(topic.name)) problems.push(`duplicate topic "${topic.name}"`);
    seenTopics.add(topic.name);
    if (!Array.isArray(topic.pages)) problems.push(`topic "${topic.name}" has no pages array`);
    for (const p of topic.pages || []) {
      if (!p.title) problems.push(`page ${JSON.stringify(p)} has no title`);
      if (!p.path) problems.push(`page "${p.title}" has no path`);
      if (p.path && !slug.test(p.path))
        problems.push(`path "${p.path}" must be lowercase kebab-case like "topic/note"`);
      if (seenPaths.has(p.path)) problems.push(`duplicate path "${p.path}"`);
      seenPaths.add(p.path);
    }
  }
  assertNoProblems("manifest", problems);
});

test("every manifest page has a matching content file", () => {
  const problems = [];
  for (const p of allPagePaths(MANIFEST)) {
    const file = path.join(CONTENT, p + ".html");
    if (!fs.existsSync(file))
      problems.push(`no content file for "${p}" (expected src/content/${p}.html)`);
  }
  assertNoProblems("manifest→content", problems);
});

test("no orphan content files missing from the manifest", () => {
  const known = new Set(allPagePaths(MANIFEST).map((p) => p + ".html"));
  const problems = walk(CONTENT)
    .filter((rel) => rel.endsWith(".html") && !known.has(rel))
    .map((rel) => `src/content/${rel} exists but is not listed in manifest.json`);
  assertNoProblems("orphans", problems);
});

test("build produced index + 404 + one file per page + styles.css", () => {
  const problems = [];
  if (!fs.existsSync(path.join(DIST, "index.html"))) problems.push("dist/index.html missing");
  if (!fs.existsSync(path.join(DIST, "404.html"))) problems.push("dist/404.html missing");
  if (!fs.existsSync(path.join(DIST, "styles.css"))) problems.push("dist/styles.css missing");
  for (const p of allPagePaths(MANIFEST)) {
    if (!fs.existsSync(path.join(DIST, p + ".html"))) problems.push(`dist/${p}.html missing`);
  }
  const expected = allPagePaths(MANIFEST).length + 2;
  const got = distHtmlFiles().length;
  if (got !== expected) problems.push(`expected ${expected} html files, built ${got}`);
  assertNoProblems("build output", problems);
});

test("no unfilled template placeholders leaked into output", () => {
  const problems = [];
  for (const f of distHtmlFiles()) {
    const html = fs.readFileSync(path.join(DIST, f), "utf8");
    const leaks = html.match(/\{\{[A-Z]+\}\}/g);
    if (leaks) problems.push(`${f} still contains ${[...new Set(leaks)].join(", ")}`);
  }
  assertNoProblems("placeholders", problems);
});

test("every page has the required shell chrome", () => {
  const problems = [];
  for (const f of distHtmlFiles()) {
    const html = fs.readFileSync(path.join(DIST, f), "utf8");
    if (!/<html lang="[^"]+"/.test(html)) problems.push(`${f}: <html> has no lang`);
    if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${f}: empty or missing <title>`);
    if (f !== "404.html" && !html.includes('class="site-header"'))
      problems.push(`${f}: missing header`);
    if (f === "index.html" || f === "404.html") {
      if (html.includes('class="sidebar"')) problems.push(`${f}: must NOT have a sidebar`);
    } else if (!html.includes('class="sidebar"')) {
      problems.push(`${f}: missing sidebar`);
    }
    if ((html.match(/<h1[\s>]/g) || []).length !== 1)
      problems.push(`${f}: must have exactly one <h1>`);
  }
  assertNoProblems("shell chrome", problems);
});

test("each note marks exactly one active sidebar item (its own)", () => {
  const problems = [];
  for (const p of allPagePaths(MANIFEST)) {
    const file = path.join(DIST, p + ".html");
    if (!fs.existsSync(file)) {
      problems.push(`${p}.html: not built`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const actives = (html.match(/class="active"/g) || []).length;
    if (actives !== 1) problems.push(`${p}.html: expected 1 active nav item, found ${actives}`);
    if (!html.includes(`href="../${p}.html" class="active"`))
      problems.push(`${p}.html: its own sidebar link is not the active one`);
  }
  assertNoProblems("active nav", problems);
});

test("Contents box matches the page's h2 sections", () => {
  const problems = [];
  for (const p of allPagePaths(MANIFEST)) {
    const file = path.join(DIST, p + ".html");
    if (!fs.existsSync(file)) {
      problems.push(`${p}.html: not built`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const h2ids = [...html.matchAll(/<h2\s+[^>]*id="([^"]+)"/g)].map((m) => m[1]);
    const tocBlock = (html.match(/<aside class="toc"[\s\S]*?<\/aside>/) || [""])[0];
    if (h2ids.length && !tocBlock) {
      problems.push(`${p}.html: has ${h2ids.length} h2 sections but no Contents box`);
      continue;
    }
    const tocTargets = hrefsIn(tocBlock)
      .filter((h) => h.startsWith("#"))
      .map((h) => h.slice(1));
    for (const id of h2ids)
      if (!tocTargets.includes(id))
        problems.push(`${p}.html: section #${id} missing from Contents box`);
    for (const t of tocTargets)
      if (!h2ids.includes(t))
        problems.push(`${p}.html: Contents links #${t} which is not an h2 section`);
  }
  assertNoProblems("contents box", problems);
});

test("all internal links resolve to real files", () => {
  const problems = [];
  for (const f of distHtmlFiles()) {
    const html = fs.readFileSync(path.join(DIST, f), "utf8");
    const dir = path.dirname(path.join(DIST, f));
    for (const href of hrefsIn(html)) {
      if (/^(https?:|mailto:|tel:)/.test(href)) continue; // external
      if (href.startsWith("#")) continue; // anchor, checked separately
      const target = href.split("#")[0];
      if (!target) {
        problems.push(`${f}: empty/hash-only href "${href}"`);
        continue;
      }
      const resolved = target.startsWith("/")
        ? path.join(DIST, target.slice(1))
        : path.resolve(dir, target);
      if (!fs.existsSync(resolved))
        problems.push(`${f}: link "${href}" → ${path.relative(DIST, resolved)} does not exist`);
    }
  }
  assertNoProblems("internal links", problems);
});

test("all anchor links point at ids that exist on the page", () => {
  const problems = [];
  for (const f of distHtmlFiles()) {
    const html = fs.readFileSync(path.join(DIST, f), "utf8");
    const ids = idsIn(html);
    for (const href of hrefsIn(html)) {
      if (!href.startsWith("#")) continue;
      const id = href.slice(1);
      if (id && !ids.has(id)) problems.push(`${f}: anchor "${href}" has no matching id`);
    }
  }
  assertNoProblems("anchors", problems);
});

test("landmarks are uniquely labelled (accessibility)", () => {
  const problems = [];
  for (const f of distHtmlFiles()) {
    const html = fs.readFileSync(path.join(DIST, f), "utf8");
    const asides = html.match(/<aside[^>]*>/g) || [];
    const labels = asides.map((a) => (a.match(/aria-label="([^"]+)"/) || [])[1]);
    labels.forEach((l, i) => {
      if (!l) problems.push(`${f}: an <aside> has no aria-label (${asides[i]})`);
    });
    if (new Set(labels).size !== labels.length)
      problems.push(`${f}: two <aside> landmarks share the same aria-label`);
  }
  assertNoProblems("landmarks", problems);
});

test("design system tokens are present in styles.css", () => {
  const css = fs.readFileSync(path.join(SRC, "styles.css"), "utf8");
  const problems = [];
  for (const tok of ["--text", "--accent", "--border", "--sidebar-w", "--toc-w"]) {
    if (!css.includes(tok + ":")) problems.push(`styles.css is missing the ${tok} token`);
  }
  assertNoProblems("design tokens", problems);
});

test("HTML validates (html-validate)", () => {
  try {
    run("npx", ["html-validate", "dist/**/*.html"]);
    log("html-validate: OK");
  } catch (e) {
    assert.fail("html-validate reported errors:\n" + (e.stdout || "") + (e.stderr || ""));
  }
});

test("formatting is consistent (prettier)", () => {
  try {
    run("npx", [
      "prettier",
      "--check",
      "src/**/*.{html,css}",
      "*.js",
      "test/**/*.js",
      "manifest.json",
    ]);
    log("prettier: OK");
  } catch (e) {
    assert.fail(
      "prettier found unformatted files (run `npm run format`):\n" +
        (e.stdout || "") +
        (e.stderr || ""),
    );
  }
});

test("landing page is sidebar-free and centered", () => {
  const html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  const problems = [];
  if (!html.includes('class="home-main"'))
    problems.push("index.html missing the centered .home-main layout");
  if (html.includes('class="sidebar"')) problems.push("index.html should not contain a sidebar");
  if (!html.includes('class="topic-card"')) problems.push("index.html has no topic cards");
  assertNoProblems("landing", problems);
});

test("404 page is minimal, linked home, and sidebar-free", () => {
  const html = fs.readFileSync(path.join(DIST, "404.html"), "utf8");
  const problems = [];
  if (!html.includes('class="not-found-main"')) problems.push("404.html missing error layout");
  if (!html.includes('class="not-found-icon"')) problems.push("404.html missing error icon");
  if (!html.includes("<h1>404 - Page not found</h1>")) problems.push("404.html missing heading");
  if (!html.includes('href="/"')) problems.push("404.html does not link home");
  if (!html.includes(">Go to home</a>")) problems.push("404.html has the wrong home-link label");
  if (!html.includes('href="/styles.css"'))
    problems.push("404.html stylesheet is not root-relative");
  if (html.includes('class="site-header"')) problems.push("404.html should not contain the header");
  if (html.includes('class="sidebar"')) problems.push("404.html should not contain a sidebar");
  if (html.includes('id="searchModal"')) problems.push("404.html should not contain search UI");
  assertNoProblems("404 page", problems);
});

test("search assets are built and wired into every page", () => {
  const problems = [];
  if (!fs.existsSync(path.join(DIST, "search.js"))) problems.push("dist/search.js missing");
  const idxPath = path.join(DIST, "search-index.json");
  if (!fs.existsSync(idxPath)) {
    problems.push("dist/search-index.json missing");
    return assertNoProblems("search", problems);
  }
  let idx;
  try {
    idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
  } catch (e) {
    problems.push("search-index.json is not valid JSON: " + e.message);
    return assertNoProblems("search", problems);
  }
  if (!Array.isArray(idx)) problems.push("search-index.json is not an array");
  const pages = allPagePaths(MANIFEST);
  if (idx.length !== pages.length)
    problems.push(`search index has ${idx.length} entries, expected ${pages.length}`);
  idx.forEach((e) => {
    if (!e.title || !e.path || !e.topic)
      problems.push(`search entry ${JSON.stringify(e.path)} missing title/path/topic`);
    if (!Array.isArray(e.sections)) problems.push(`search entry "${e.path}" has no sections array`);
  });
  for (const f of distHtmlFiles()) {
    if (f === "404.html") continue;
    const html = fs.readFileSync(path.join(DIST, f), "utf8");
    if (!/<script src="[^"]*search\.js">/.test(html))
      problems.push(`${f}: does not load search.js`);
    if (!html.includes('id="searchModal"')) problems.push(`${f}: missing search modal`);
  }
  assertNoProblems("search", problems);
});

test("logo + icons are present and referenced on every page", () => {
  const problems = [];
  if (!fs.existsSync(path.join(DIST, "knowledge_base_logo.png")))
    problems.push("dist/knowledge_base_logo.png missing");
  if (!fs.existsSync(path.join(DIST, "apple-touch-icon.png")))
    problems.push("dist/apple-touch-icon.png missing (iOS home-screen icon)");
  for (const f of distHtmlFiles()) {
    const html = fs.readFileSync(path.join(DIST, f), "utf8");
    if (!/knowledge_base_logo\.png/.test(html)) problems.push(`${f}: does not reference the logo`);
    if (f !== "404.html" && !/rel="apple-touch-icon"/.test(html))
      problems.push(`${f}: missing apple-touch-icon link (iOS shows a letter without it)`);
  }
  assertNoProblems("logo + icons", problems);
});

const SITE_URL = (process.env.SITE_URL || "https://knowledge-base.somyashrestha.space").replace(
  /\/+$/,
  "",
);
const pageUrl = (p) => `${SITE_URL}/${p}.html`;

test("sitemap.xml lists the homepage and every page", () => {
  const problems = [];
  const file = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(file)) {
    problems.push("dist/sitemap.xml missing");
    return assertNoProblems("sitemap", problems);
  }
  const xml = fs.readFileSync(file, "utf8");
  if (!xml.startsWith("<?xml")) problems.push("sitemap.xml missing XML declaration");
  if (!xml.includes("http://www.sitemaps.org/schemas/sitemap/0.9"))
    problems.push("sitemap.xml missing urlset namespace");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.includes(`${SITE_URL}/`)) problems.push("sitemap.xml missing homepage URL");
  for (const p of allPagePaths(MANIFEST)) {
    if (!locs.includes(pageUrl(p))) problems.push(`sitemap.xml missing ${pageUrl(p)}`);
  }
  for (const loc of locs) {
    if (!loc.startsWith(SITE_URL + "/"))
      problems.push(`sitemap.xml has a non-canonical URL: ${loc}`);
  }
  const expected = allPagePaths(MANIFEST).length + 1;
  if (locs.length !== expected)
    problems.push(`sitemap.xml has ${locs.length} URLs, expected ${expected}`);
  const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  for (const d of lastmods) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) problems.push(`sitemap.xml has a bad <lastmod>: ${d}`);
  }
  assertNoProblems("sitemap", problems);
});

test("rss.xml is a valid feed covering every note", () => {
  const problems = [];
  const file = path.join(DIST, "rss.xml");
  if (!fs.existsSync(file)) {
    problems.push("dist/rss.xml missing");
    return assertNoProblems("rss", problems);
  }
  const xml = fs.readFileSync(file, "utf8");
  if (!xml.startsWith("<?xml")) problems.push("rss.xml missing XML declaration");
  if (!/<rss version="2\.0"/.test(xml)) problems.push("rss.xml is not an RSS 2.0 document");
  if (!xml.includes(`<link>${SITE_URL}/</link>`)) problems.push("rss.xml channel link is wrong");
  if (!xml.includes(`href="${SITE_URL}/rss.xml"`))
    problems.push("rss.xml missing atom:link self reference");
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const pages = allPagePaths(MANIFEST);
  if (items.length !== pages.length)
    problems.push(`rss.xml has ${items.length} items, expected ${pages.length}`);
  const links = items.map((it) => (it.match(/<link>([^<]+)<\/link>/) || [])[1]);
  for (const p of pages) {
    if (!links.includes(pageUrl(p))) problems.push(`rss.xml missing an item for ${pageUrl(p)}`);
  }
  for (const it of items) {
    if (!/<title>[^<]+<\/title>/.test(it)) problems.push("an rss item has no <title>");
    if (!/<guid[^>]*>[^<]+<\/guid>/.test(it)) problems.push("an rss item has no <guid>");
    if (!/<pubDate>[^<]+<\/pubDate>/.test(it)) problems.push("an rss item has no <pubDate>");
  }
  assertNoProblems("rss", problems);
});

test("robots.txt points at the sitemap and every page links the feed", () => {
  const problems = [];
  const robots = path.join(DIST, "robots.txt");
  if (!fs.existsSync(robots)) {
    problems.push("dist/robots.txt missing");
  } else {
    const txt = fs.readFileSync(robots, "utf8");
    if (!txt.includes(`Sitemap: ${SITE_URL}/sitemap.xml`))
      problems.push("robots.txt does not reference the sitemap");
  }
  for (const f of distHtmlFiles()) {
    if (f === "404.html") continue;
    const html = fs.readFileSync(path.join(DIST, f), "utf8");
    if (!/rel="alternate"[\s\S]*?application\/rss\+xml/.test(html))
      problems.push(`${f}: missing RSS <link rel="alternate">`);
  }
  assertNoProblems("robots + feed discovery", problems);
});
