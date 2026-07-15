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
      const items = topic.pages.length
        ? topic.pages
            .map((p) => {
              const active = p.path === activePath ? ' class="active"' : "";
              return `          <li><a href="${prefix}${p.path}.html"${active}>${p.title}</a></li>`;
            })
            .join("\n")
        : `          <li><span class="empty" style="padding:5px 10px;color:var(--faint);font-size:14px;">— soon —</span></li>`;
      return (
        `      <div class="nav-group">\n` +
        `        <p class="label">${topic.name}</p>\n` +
        `        <ul>\n${items}\n        </ul>\n` +
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
    `          <svg class="toc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>\n` +
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
    if (i > 0) out.push(`<span>/</span>`);
    const cls = i === parts.length - 1 ? ' class="here"' : "";
    out.push(`<span${cls}>${seg}</span>`);
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
      const list = t.pages.length
        ? t.pages.map((p) => `<li><a href="${p.path}.html">${p.title}</a></li>`).join("")
        : `<li class="empty">nothing here yet</li>`;
      return `        <div class="topic-card"><h3>${t.name}</h3><ul>${list}</ul></div>`;
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
  fs.writeFileSync(path.join(DIST, "search-index.json"), JSON.stringify(searchIndex));
  fs.copyFileSync(path.join(SRC, "styles.css"), path.join(DIST, "styles.css"));
  fs.copyFileSync(path.join(SRC, "search.js"), path.join(DIST, "search.js"));
  copyDir(PUBLIC, DIST);

  // Generated after copyDir so they always reflect the current manifest/content.
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), buildSitemap(entries));
  fs.writeFileSync(path.join(DIST, "rss.xml"), buildRss(entries));
  fs.writeFileSync(path.join(DIST, "robots.txt"), buildRobots());

  console.log(`\nBuilt ${count} page(s) + index + sitemap.xml + rss.xml → dist/`);
}

main();
