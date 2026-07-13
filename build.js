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
    `        <b>Contents</b>\n` +
    `        <ol start="0">\n${items.join("\n")}\n        </ol>\n` +
    `      </aside>`
  );
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

function render(pagePath, title, contentHtml) {
  const prefix = rootPrefix(pagePath);
  return shell
    .replace(/\{\{ROOT\}\}/g, prefix)
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{BREADCRUMB\}\}/g, buildBreadcrumb(pagePath))
    .replace(/\{\{SIDEBAR\}\}/g, buildSidebar(pagePath, prefix))
    .replace(/\{\{CONTENT\}\}/g, contentHtml.trim())
    .replace(/\{\{CONTENTS\}\}/g, buildContents(contentHtml));
}

function renderIndex() {
  const cards = manifest.topics
    .map((t) => {
      const list = t.pages.length
        ? t.pages.map((p) => `<li><a href="${p.path}.html">${p.title}</a></li>`).join("")
        : `<li class="empty">nothing here yet</li>`;
      return `<div class="topic-card"><h3>${t.name}</h3><ul>${list}</ul></div>`;
    })
    .join("\n");
  const content =
    `<div class="home">\n` +
    `  <h1>knowledge base</h1>\n` +
    `  <p class="subtitle">Personal notes on Java, C++, DSA and whatever else is worth writing down.</p>\n` +
    `  <div class="topic-grid">\n${cards}\n  </div>\n` +
    `</div>`;
  return shell
    .replace(/\{\{ROOT\}\}/g, "")
    .replace(/\{\{TITLE\}\}/g, "Home")
    .replace(/\{\{BREADCRUMB\}\}/g, "")
    .replace(/\{\{SIDEBAR\}\}/g, buildSidebar(null, ""))
    .replace(/\{\{CONTENT\}\}/g, content)
    .replace(/\{\{CONTENTS\}\}/g, "");
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.cpSync(from, to, { recursive: true });
}

function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  let count = 0;
  const seen = new Set();

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
      count++;
      console.log(`✓ ${page.path}.html`);
    }
  }

  walk(CONTENT).forEach((rel) => {
    if (!seen.has(rel)) console.warn(`! orphan (not in manifest): src/content/${rel}`);
  });

  fs.writeFileSync(path.join(DIST, "index.html"), renderIndex());
  fs.copyFileSync(path.join(SRC, "styles.css"), path.join(DIST, "styles.css"));
  copyDir(PUBLIC, DIST);

  console.log(`\nBuilt ${count} page(s) + index → dist/`);
}

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    return d.isDirectory() ? walk(full, base) : [path.relative(base, full)];
  });
}

main();
