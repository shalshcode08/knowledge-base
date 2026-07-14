# knowledge-base

Personal knowledge base — a static docs site of hand-written notes (Java, C++, DSA, …),
built from plain HTML and deployed automatically to Cloudflare Pages via GitHub Actions.

## How it works

You write **content-only HTML** (just the `<h1>`, callouts, code, tables — no page chrome).
`build.js` wraps each note in the shared shell (header, sidebar, Contents box) and writes a
static site to `dist/`. Push to `main` → CI checks it → Cloudflare Pages serves it.

```
src/content/java/oops.html      ─┐
manifest.json  (nav order)       ├──►  node build.js  ──►  dist/  ──►  Cloudflare Pages
src/shell.html + src/styles.css ─┘
```

## Repo layout

| Path | What it is |
|------|-----------|
| `src/content/<topic>/<note>.html` | Your notes — content only, no `<head>`/sidebar |
| `manifest.json` | Topics + pages; the single source of truth for the sidebar |
| `src/styles.css` | The locked design system (edit once, changes everywhere) |
| `src/shell.html` | The page template with `{{SLOTS}}` the build fills |
| `build.js` | Wraps content in the shell → `dist/` (no dependencies) |
| `public/` | Images/assets, copied to the site as-is |
| `dist/` | Generated output (git-ignored) — what gets deployed |

## Add a new note

1. Create the file, e.g. `src/content/dsa/arrays.html` — start from an existing note.
   - Use `<h2 id="...">` for sections; the **Contents box builds itself** from them.
   - Optional short label: `<h2 id="x" data-toc="Short label">`.
2. Add one line to `manifest.json` under the right topic:
   ```json
   { "title": "Arrays", "path": "dsa/arrays" }
   ```
3. `git push` (via a PR). CI validates it, merge deploys it. Done.

## Local commands

```bash
npm install          # one-time: install dev tools
npm run build        # build into dist/
npm run preview      # build + serve locally
npm run format       # auto-format everything (Prettier)
npm test             # the full gate — run this before you push
```

## The test gate

`npm test` (`test/site.test.js`, Node's built-in runner, no extra deps) is the single
gate that must pass before anything reaches production. It builds the site fresh, then
verifies — with a **verbose list of exactly what's wrong** on failure:

- `manifest.json` is well-formed; paths are lowercase kebab-case; no duplicates
- every manifest page has a content file, and no content file is orphaned
- the build produced an index, every page, and `styles.css`
- no unfilled `{{PLACEHOLDER}}` leaked into output
- every page has the shell chrome, a `lang`, a `<title>`, exactly one `<h1>`
- each note marks exactly its own sidebar item active
- the Contents box matches the page's `<h2>` sections
- every internal link resolves to a real file
- every `#anchor` points at an id that exists on the page
- landmarks are uniquely labelled (accessibility)
- the design tokens exist in `styles.css`
- HTML validates (`html-validate`) and formatting is consistent (`prettier`)

## CI/CD

- **`.github/workflows/ci.yml`** — on every PR: `npm test` + external link check.
  Keeps `main` always deployable.
- **`.github/workflows/deploy.yml`** — on push to `main`: `npm test` **must pass**, then
  deploy to Cloudflare Pages. A failing test blocks the deploy.

### One-time setup (Cloudflare + GitHub)

1. Create a Cloudflare Pages project named **`knowledge-base`**
   (dashboard → Workers & Pages → Create → Pages → *Direct Upload*, or run
   `npx wrangler pages project create knowledge-base` once).
2. Create a Cloudflare API token with the **Cloudflare Pages: Edit** permission.
3. In GitHub → repo → Settings → Secrets and variables → Actions, add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. Push to `main`. It builds and deploys itself from there on.
