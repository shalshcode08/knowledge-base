<div align="center">
  <a href="https://knowledge-base.somyashrestha.space">
    <img
      src="./public/knowledge_base_logo.png"
      alt="Knowledge Base logo"
      width="96"
      height="96"
    />
  </a>

  <h1>Knowledge Base</h1>

  <p>
    In-depth engineering notes for structured learning, practical revision, and technical
    interviews.
  </p>

  <p>
    <a href="https://knowledge-base.somyashrestha.space"><strong>Explore the documentation</strong></a>
  </p>

  <p>
    <a href="https://github.com/shalshcode08/knowledge-base/actions/workflows/ci.yml">
      <img
        src="https://github.com/shalshcode08/knowledge-base/actions/workflows/ci.yml/badge.svg"
        alt="CI status"
      />
    </a>
    <a href="https://github.com/shalshcode08/knowledge-base/actions/workflows/deploy.yml">
      <img
        src="https://github.com/shalshcode08/knowledge-base/actions/workflows/deploy.yml/badge.svg"
        alt="Deployment status"
      />
    </a>
    <img
      src="https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white"
      alt="Node.js 24"
    />
  </p>
</div>

## About

Knowledge Base is a static documentation site containing detailed, interview-focused technical
notes. Each guide combines fundamentals, mental models, practical examples, edge cases, common
mistakes, production guidance, practice exercises, interview questions, and revision cheat sheets.

The project uses content-only HTML and a small Node.js build pipeline. Shared navigation, search,
page structure, metadata, RSS, sitemap generation, and styling are applied automatically.

## Highlights

- In-depth notes written in approachable language
- Practical examples and production considerations
- Interview questions, exercises, and concise cheat sheets
- Responsive navigation with full-text search
- Automatically generated table of contents for every guide
- Automated HTML, link, navigation, accessibility, and formatting checks
- Sitemap and RSS feed generation
- Continuous deployment to Cloudflare Pages

## Quick Start

### Requirements

- Node.js 24
- npm

### Local Development

```bash
git clone https://github.com/shalshcode08/knowledge-base.git
cd knowledge-base
npm install
npm run preview
```

The preview command builds the site and serves the generated `dist/` directory locally.

### Available Commands

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `npm run build`   | Generate the production site in `dist/` |
| `npm run preview` | Build and serve the site locally        |
| `npm run format`  | Format source files with Prettier       |
| `npm test`        | Run the complete validation suite       |

## Architecture

```text
src/content/              Topic documentation
      |
      v
manifest.json             Navigation and page registry
      |
      v
build.js                  Static site generator
      |
      +---- src/shell.html
      +---- src/styles.css
      +---- public/
      |
      v
dist/                     Deployable static site
```

The build process:

1. Reads the topic and page order from `manifest.json`.
2. Loads each content-only HTML document from `src/content/`.
3. Generates navigation, page metadata, breadcrumbs, and table of contents.
4. Wraps the content with the shared application shell.
5. Builds search assets, sitemap, RSS feed, robots file, and static pages.
6. Writes the complete site to `dist/`.

## Continuous Integration

Pull requests and non-main branches run the complete test suite and external-link validation.
Changes merged into `main` are tested again before deployment to Cloudflare Pages.
