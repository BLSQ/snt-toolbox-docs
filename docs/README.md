# Documentation site

This repository includes a small **static documentation site generator** that turns Markdown files in `docs/src/` into plain HTML pages in `docs/build/`.

## Quick start

From the repo root:

```bash
npm ci
npm run docs:serve
```

`docs:serve` builds the site into `docs/build/` and serves it at http://localhost:8000/ (Ctrl+C stops it).
Use `PORT=8080 npm run docs:serve` to pick another port. To only build without serving, run `npm run docs:build`.

## Structure

### Sources

- **Languages**: each folder directly under `docs/src/` that contains at least one Markdown page is a language
  (today: `docs/src/en/`). Folders such as `docs/src/fr/` are picked up automatically once they contain pages.
- **Private (not built)**: `docs/src/private/`
- **Shared static assets**: `docs/src/assets/` (`logo.svg`). Page images are synced from the Claude Doc into
  `docs/src/assets/<lang>/` by `/sync-docs`, which owns that folder: it deletes images no page uses.

Files and folders whose name starts with `_` or `.` are ignored by the build, as is `private/`.
Use `_` for drafts you want to keep in the tree without publishing them.

### Templates

- **HTML template**: `docs/templates/page.html`
- **CSS**: `docs/templates/styles.css`

### Output

The build generates:

- `docs/build/styles.css`
- `docs/build/assets/` (copied from `docs/src/assets/`)
- `docs/build/<lang>/**` for each language that has pages
- `docs/build/index.html` (redirects to `./en/index.html`, or to the first language that has pages)

## Conventions

### Page order and URLs

- Pages are ordered by **filename**, with numbers compared numerically: `00-home.md` before `02-…` before `10-…`.
  Titles do not affect the order.
- A leading order prefix `NN-` (digits followed by a dash) is removed from URLs:
  `00-home.md` → `home.html`, `guides/03-install.md` → `guides/install.html`.
- Use names such as `00-home.md`, `01-what-the-toolbox-does.md`, `02-…`; the number is only for sorting.

### Home page

The **first page in that order** is the home page. The language's `index.html` redirects to it, and the
sidebar brand links to it. So `00-home.md` is the landing page.

### Page title

The generator uses the **first H1** (`# ...`) in each Markdown file as the page title and removes that H1 from the rendered content body.

### Sidebar (TOC)

- Pages are grouped by **top-level folder** (section header), in order of their first page.
- Files directly under `docs/src/<lang>/` appear without a section header.

### Language switcher

- The language selector appears at the **top-right of the page** only when **two or more languages** have pages.
  With one language (today, English only), it is not shown.
- When switching languages, it tries to open the **same source-relative page** in the other language (same path under `docs/src/<lang>/`, same file name).
- If that translation does not exist, it falls back to that language’s home page.

## Adding new pages

Pages in `docs/src/en/` are generated from the Claude Doc by `/sync-docs` (see `CONTRIBUTING.md`):
add a tab to the doc and sync. The steps below are for trying the generator locally.

1. Create a Markdown file under `docs/src/en/` (and/or another `docs/src/<lang>/`), named with its order prefix,
   e.g. `docs/src/en/03-configuring-interventions.md`.
2. Give it an H1 title as the first heading.
3. Preview it:

```bash
npm run docs:serve
```

## Notes

- The output uses plain HTML+CSS and a CSS-only mobile hamburger menu for the sidebar.
- The generator script lives in `docs/scripts/build-docs.mjs`.

## Licence

Copyright © 2026 Bluesquare.

- **Code** (the generator, templates, CSS, workflows and other tooling) is licensed under the
  **MIT License**: see [`LICENSE`](../LICENSE).
- **Documentation content** (the Markdown pages and images in `docs/src/`, and the site built
  from them) is licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)**:
  see [`LICENSE-docs`](../LICENSE-docs).
- Logos and trademarks (such as `docs/src/assets/logo.svg`) are covered by neither licence.

