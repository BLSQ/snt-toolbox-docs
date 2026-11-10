# Contributing to the SNT Toolbox documentation

The site https://docs.snt-toolbox.org is generated from this repository.

## Where the content lives

The content is written in a Claude Doc, **"SNT Toolbox documentation"**:
https://claude.ai/artifact/DqgzieyF4gabME36ftNbsw

That doc is the **single source of truth**. The Markdown files in `docs/src/` are generated from it
and must **not be edited by hand**: any manual change is overwritten at the next sync.

To change the documentation, edit the Claude Doc.

## Publishing changes

1. **Edit the Claude Doc.** One tab = one page on the site. Tab order = page order; the first tab is the home page.
2. **Sync.** From the repo root, in Claude Code, run `/sync-docs`. It reads the doc and rewrites
   `docs/src/en/` and `docs/src/assets/`, then builds the site. It never commits.
3. **Review locally.** Check the changed files (`git diff`) and preview the site (see below).
4. **Open a pull request into `main`.** GitHub Actions builds the site to check it, but does not deploy it.
5. **Merge.** Every push to `main` builds the site and deploys it to GitHub Pages.
   A deploy can also be started by hand from the Actions tab (*Run workflow*).

`main` is the only long-lived branch.

## Building locally

Requirements: Node.js 22 (or at least 20).

```bash
npm ci               # install the dependencies listed in package-lock.json
npm run docs:build   # generate the site into docs/build/
```

Then open `docs/build/index.html` in a browser.

## What is where

| Path | What it is |
|------|------------|
| `docs/src/<lang>/` | Generated Markdown pages (do not edit) |
| `docs/src/assets/` | Images used by the pages |
| `docs/templates/` | HTML template and CSS of the site |
| `docs/scripts/build-docs.mjs` | The site generator |
| `.github/workflows/` | Build and deploy pipeline |
| `PLAN.md` | Current work plan |

Changes to the templates, the generator or the workflow go through a normal pull request.
