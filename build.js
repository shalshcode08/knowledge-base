#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const CONTENT = path.join(SRC, "content");
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");

const SITE_URL = (process.env.SITE_URL || "https://knowledge-base.somyashrestha.space").replace(
  /\/+$/,
  "",
);
const SITE_TITLE = "knowledge base";
const SITE_DESC = "In-depth technical study notes — Java, C++, DSA.";

const RSS_ICON =
  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
  `<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/>` +
  `<circle cx="5" cy="19" r="1"/></svg>`;

function rssLinkHtml(prefix) {
  return `<a href="${prefix}rss.xml">${RSS_ICON}<span>RSS feed</span></a>`;
}

// lucide chevron-down, shared by the Contents toggle and the "show more" toggles.
function chevronDown(cls, size) {
  return (
    `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
    `aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`
  );
}

// A topic with more than this many notes collapses behind a "show more" toggle.
const VISIBLE = 5;

function showMoreButton(hidden, expanded) {
  const label = `Show ${hidden} more`;
  return (
    `<button type="button" class="show-more" aria-expanded="${expanded}" data-more="${label}">` +
    `${chevronDown("more-chevron", 14)}` +
    `<span class="show-more-label">${expanded ? "Show less" : label}</span>` +
    `</button>`
  );
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const shell = fs.readFileSync(path.join(SRC, "shell.html"), "utf8");

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Last-commit date for a file, so sitemap/RSS auto-update when content changes.
// Falls back to file mtime for not-yet-committed files (or shallow CI checkouts).
function lastModified(file) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${file}"`, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (out) return out;
  } catch {
    /* not a git repo / no history — fall through */
  }
  return new Date(fs.statSync(file).mtime).toISOString();
}

function leadText(html) {
  const m = html.match(/<p class="subtitle">([\s\S]*?)<\/p>/i);
  return (m ? m[1] : "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function newestDate(entries) {
  return (
    entries
      .map((e) => e.lastmod)
      .sort()
      .slice(-1)[0] || new Date().toISOString()
  );
}

function buildSitemap(entries) {
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: newestDate(entries) },
    ...entries.map((e) => ({ loc: e.loc, lastmod: e.lastmod })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n` +
        `    <lastmod>${u.lastmod.slice(0, 10)}</lastmod>\n  </url>`,
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
}

function buildRss(entries) {
  const items = [...entries]
    .sort((a, b) => (a.lastmod < b.lastmod ? 1 : -1))
    .map(
      (e) =>
        `    <item>\n` +
        `      <title>${xmlEscape(e.title)}</title>\n` +
        `      <link>${xmlEscape(e.loc)}</link>\n` +
        `      <guid isPermaLink="true">${xmlEscape(e.loc)}</guid>\n` +
        `      <category>${xmlEscape(e.topic)}</category>\n` +
        `      <pubDate>${new Date(e.lastmod).toUTCString()}</pubDate>\n` +
        `      <description>${xmlEscape(e.description)}</description>\n` +
        `    </item>`,
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
    `  <channel>\n` +
    `    <title>${xmlEscape(SITE_TITLE)}</title>\n` +
    `    <link>${SITE_URL}/</link>\n` +
    `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>\n` +
    `    <description>${xmlEscape(SITE_DESC)}</description>\n` +
    `    <language>en</language>\n` +
    `    <lastBuildDate>${new Date(newestDate(entries)).toUTCString()}</lastBuildDate>\n` +
    `${items}\n` +
    `  </channel>\n` +
    `</rss>\n`
  );
}

function buildRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

function rootPrefix(pagePath) {
  const depth = pagePath.split("/").length - 1;
  return "../".repeat(depth);
}

function buildSidebar(activePath, prefix) {
  return manifest.topics
    .map((topic) => {
      const collapsible = topic.pages.length > VISIBLE;
      // Never hide the page you're on — expand the group if it lives in the tail.
      const activeIdx = topic.pages.findIndex((p) => p.path === activePath);
      const expanded = collapsible && activeIdx >= VISIBLE;

      const items = topic.pages.length
        ? topic.pages
            .map((p, i) => {
              const active = p.path === activePath ? ' class="active"' : "";
              const extra = collapsible && i >= VISIBLE ? ' class="extra"' : "";
              return `          <li${extra}><a href="${prefix}${p.path}.html"${active}>${p.title}</a></li>`;
            })
            .join("\n")
        : `          <li><span class="empty" style="padding:5px 10px;color:var(--faint);font-size:14px;">— soon —</span></li>`;

      const more = collapsible
        ? `\n        ${showMoreButton(topic.pages.length - VISIBLE, expanded)}`
        : "";
      const attrs =
        `class="nav-group${expanded ? " expanded" : ""}"` +
        (collapsible ? " data-collapsible" : "");

      return (
        `      <div ${attrs}>\n` +
        `        <p class="label">${topic.name}</p>\n` +
        `        <ul>\n${items}\n        </ul>${more}\n` +
        `      </div>`
      );
    })
    .join("\n");
}

function buildContents(html) {
  const re = /<h2\s+([^>]*?)>([\s\S]*?)<\/h2>/g;
  const items = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1];
    const idMatch = attrs.match(/id="([^"]+)"/);
    if (!idMatch) continue;
    const id = idMatch[1];
    const tocMatch = attrs.match(/data-toc="([^"]+)"/);
    const label = (tocMatch ? tocMatch[1] : m[2].replace(/<span class="num">[\s\S]*?<\/span>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    items.push(`        <li><a href="#${id}">${label}</a></li>`);
  }
  if (!items.length) return "";
  return (
    `      <aside class="toc" aria-label="On this page">\n` +
    `        <button type="button" class="toc-head" aria-expanded="false" aria-controls="tocList">\n` +
    `          <b>Contents</b>\n` +
    `          ${chevronDown("toc-chevron", 16)}\n` +
    `        </button>\n` +
    `        <ol id="tocList" start="0">\n${items.join("\n")}\n        </ol>\n` +
    `      </aside>`
  );
}

function extractSections(html) {
  const re = /<h([23])\s+([^>]*?)>([\s\S]*?)<\/h\1>/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const idMatch = m[2].match(/id="([^"]+)"/);
    if (!idMatch) continue;
    const tocMatch = m[2].match(/data-toc="([^"]+)"/);
    const text = (tocMatch ? tocMatch[1] : m[3].replace(/<span class="num">[\s\S]*?<\/span>/g, ""))
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
    out.push({ text, id: idMatch[1] });
  }
  return out;
}

function buildBreadcrumb(pagePath) {
  const parts = pagePath.split("/");
  const out = [];
  parts.forEach((seg, i) => {
    const last = i === parts.length - 1;
    // Parent crumbs + separators drop away on narrow screens; the current page always stays.
    if (i > 0) out.push(`<span class="crumb-hide">/</span>`);
    out.push(`<span class="${last ? "here" : "crumb-hide"}">${seg}</span>`);
  });
  return out.join("");
}

function noteMain(pagePath, prefix, contentHtml) {
  return (
    `<div class="overlay" id="overlay"></div>\n` +
    `    <div class="layout">\n` +
    `      <aside class="sidebar" id="sidebar" aria-label="Topics">\n` +
    `${buildSidebar(pagePath, prefix)}\n` +
    `      </aside>\n` +
    `      <main class="content">\n` +
    `        <article class="article">${contentHtml.trim()}</article>\n` +
    `      </main>\n` +
    `${buildContents(contentHtml)}\n` +
    `    </div>`
  );
}

function homeMain() {
  const cards = manifest.topics
    .map((t) => {
      const collapsible = t.pages.length > VISIBLE;
      const list = t.pages.length
        ? t.pages
            .map((p, i) => {
              const extra = collapsible && i >= VISIBLE ? ' class="extra"' : "";
              return `<li${extra}><a href="${p.path}.html">${p.title}</a></li>`;
            })
            .join("")
        : `<li class="empty">nothing here yet</li>`;
      const more = collapsible ? showMoreButton(t.pages.length - VISIBLE, false) : "";
      const attrs = `class="topic-card"` + (collapsible ? " data-collapsible" : "");
      return `        <div ${attrs}><h3>${t.name}</h3><ul>${list}</ul>${more}</div>`;
    })
    .join("\n");
  return (
    `<main class="home-main">\n` +
    `      <div class="home">\n` +
    `        <img class="home-logo" src="knowledge_base_logo.png" alt="" width="76" height="76" />\n` +
    `        <h1>knowledge base</h1>\n` +
    `        <div class="topic-grid">\n${cards}\n        </div>\n` +
    `        <footer class="home-foot">${rssLinkHtml("")}</footer>\n` +
    `      </div>\n` +
    `    </main>`
  );
}

function fill(vars, main) {
  return shell
    .replace(/\{\{ROOT\}\}/g, () => vars.root)
    .replace(/\{\{BODYCLASS\}\}/g, () => vars.bodyClass)
    .replace(/\{\{TITLE\}\}/g, () => vars.title)
    .replace(/\{\{BREADCRUMB\}\}/g, () => vars.breadcrumb)
    .replace(/\{\{MAIN\}\}/g, () => main);
}

function render(pagePath, title, contentHtml) {
  const prefix = rootPrefix(pagePath);
  return fill(
    { root: prefix, bodyClass: "", title, breadcrumb: buildBreadcrumb(pagePath) },
    noteMain(pagePath, prefix, contentHtml),
  );
}

function renderIndex() {
  return fill({ root: "", bodyClass: "is-home", title: "Home", breadcrumb: "" }, homeMain());
}

function notFoundMain() {
  return (
    `<main class="not-found-main">\n` +
    `      <div class="not-found">\n` +
    `        <div class="not-found-title">\n` +
    `          <svg class="not-found-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\n` +
    `            <circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>\n` +
    `          </svg>\n` +
    `          <h1>404 - Page not found</h1>\n` +
    `        </div>\n` +
    `        <a href="/">Go to home</a>\n` +
    `      </div>\n` +
    `    </main>`
  );
}

function renderNotFound() {
  return (
    `<!doctype html>\n` +
    `<html lang="en">\n` +
    `  <head>\n` +
    `    <meta charset="UTF-8" />\n` +
    `    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n` +
    `    <meta name="robots" content="noindex" />\n` +
    `    <title>Page not found · knowledge base</title>\n` +
    `    <link rel="icon" href="/knowledge_base_logo.png" />\n` +
    `    <link rel="stylesheet" href="/styles.css" />\n` +
    `  </head>\n` +
    `  <body class="is-not-found">\n` +
    `    ${notFoundMain()}\n` +
    `  </body>\n` +
    `</html>\n`
  );
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
}

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    return d.isDirectory() ? walk(full, base) : [path.relative(base, full)];
  });
}

function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  let count = 0;
  const seen = new Set();
  const searchIndex = [];
  const entries = [];

  for (const topic of manifest.topics) {
    for (const page of topic.pages) {
      const srcFile = path.join(CONTENT, page.path + ".html");
      if (!fs.existsSync(srcFile)) {
        console.error(`✗ missing content file for "${page.path}" → ${srcFile}`);
        process.exitCode = 1;
        continue;
      }
      seen.add(page.path + ".html");
      const content = fs.readFileSync(srcFile, "utf8");
      const outFile = path.join(DIST, page.path + ".html");
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, render(page.path, page.title, content));
      searchIndex.push({
        title: page.title,
        topic: topic.name,
        path: page.path,
        sections: extractSections(content),
      });
      entries.push({
        title: page.title,
        topic: topic.name,
        loc: `${SITE_URL}/${page.path}.html`,
        lastmod: lastModified(srcFile),
        description: leadText(content),
      });
      count++;
      console.log(`✓ ${page.path}.html`);
    }
  }

  walk(CONTENT).forEach((rel) => {
    if (!seen.has(rel)) console.warn(`! orphan (not in manifest): src/content/${rel}`);
  });

  fs.writeFileSync(path.join(DIST, "index.html"), renderIndex());
  fs.writeFileSync(path.join(DIST, "404.html"), renderNotFound());
  fs.writeFileSync(path.join(DIST, "search-index.json"), JSON.stringify(searchIndex));
  fs.copyFileSync(path.join(SRC, "styles.css"), path.join(DIST, "styles.css"));
  fs.copyFileSync(path.join(SRC, "search.js"), path.join(DIST, "search.js"));
  copyDir(PUBLIC, DIST);

  // Generated after copyDir so they always reflect the current manifest/content.
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), buildSitemap(entries));
  fs.writeFileSync(path.join(DIST, "rss.xml"), buildRss(entries));
  fs.writeFileSync(path.join(DIST, "robots.txt"), buildRobots());

  console.log(`\nBuilt ${count} page(s) + index + 404 + sitemap.xml + rss.xml → dist/`);
}

main();
