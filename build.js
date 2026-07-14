#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const CONTENT = path.join(SRC, "content");
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const shell = fs.readFileSync(path.join(SRC, "shell.html"), "utf8");

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
    `          <svg class="toc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>\n` +
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

  console.log(`\nBuilt ${count} page(s) + index → dist/`);
}

main();
