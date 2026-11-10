# Plan: repo cleanup, deployment and first content sync

Status: **approved 2026-11-10; step 1 done (merged); step 2 done (merged); step 3 done (merged); step 4 done (committed directly to `main`); step 5 sync run, awaiting review.** Update the checkboxes as steps land.

This file is the hand-off point between agent sessions. Read it fully before doing anything,
then pick up the first unchecked step.

## Context

- The site https://docs.snt-toolbox.org is built from Markdown in `docs/src/<lang>/` by a small
  homemade generator (`docs/scripts/build-docs.mjs`, templates in `docs/templates/`) and published
  by GitHub Actions to GitHub Pages.
- The official content is written by the team in a Claude Doc, **"SNT Toolbox documentation"**:
  https://claude.ai/artifact/DqgzieyF4gabME36ftNbsw (9 tabs: Home, What the toolbox does,
  1. Data orchestration and analysis, 2. Importing and reviewing data, 3. Creating composite
  risk scores, 4. Configuring interventions, 5. Setting up the budget, 6. Building a scenario, FAQ).
  It is read through the Claude Docs connector (MCP), not by web fetch.
- The repo still contains leftovers from an earlier Jekyll version, and currently deploys from
  branch `v2` while the default branch is `main`.

## Decisions (settled 2026-11-10)

| # | Decision |
|---|----------|
| D1 | The Claude Doc is the **single source of truth** for content. Files in `docs/src/` are generated from it and never edited by hand. |
| D2 | Doc → Markdown is done by a **Claude Code project skill** (`/sync-docs`), run by a human, output reviewed and committed by the human. No GitHub Action (CI cannot authenticate to Claude Docs). |
| D3 | `main` is the only long-lived branch and the publishing branch. `v2` and `just-the-docs` are retired. PRs run a build check without deploying. |
| D4 | Page order comes from a numeric filename prefix (`00-home.md`, `01-…`); the prefix is stripped from URLs. The first page is the home page. |
| D5 | English only for now. French is required later; **who owns the translation is open** (in the Claude Doc, or elsewhere). The language switcher is shown only when more than one language has pages. |
| D6 | Licence: **MIT** for code, **CC BY 4.0** for documentation content. Copyright holder: **Bluesquare**. |
| D7 | UI: only minimal generator changes now. Later redesign will use **Bluesquare's product design system (from Claude Design templates)**; framework choice deferred until then. |
| D8 | Agents are **technically blocked** from committing, pushing and destructive actions (read-only git is allowed). The user runs all git/GitHub operations; agents hand over exact commands, branch names, commit messages and PR texts. |
| D9 | The custom domain is configured in GitHub **Settings → Pages**; the root `CNAME` file (only on `main`) is not used by an Actions deploy and is removed. |

## Working rules for agents

- One step = one branch = one PR. Finish a step, hand over the git commands, **stop**. Do not edit
  files for the next step until the user confirms the current one is merged.
- Never stage anything under `ignore/`.
- Before claiming a step is done, run `npm run docs:build` and check the output.
- The user is new to `npm`/Node: at least at the beginning, when a step involves building or previewing,
  give the exact commands to run from the repo root, explain in plain words what each does and what
  output to expect, so the user can check the site on localhost on their own.

## Steps

### Step 1 — Cleanup and deployment (`chore/cleanup-and-deploy`)

- [x] User: branch `chore/cleanup-and-deploy` from `v2`, merge `origin/main` into it (brings the `CNAME` commit).
      Done 2026-11-10 (merge commit `4c2790b`). User's Node upgraded to v22 via nvm.
- Agent edits below done 2026-11-10 (build passes with zero pages). Step 1 squash-merged into `main` 2026-11-10.
  Also bumped `marked` (npm audit fix, GHSA-6v9c-7cg6-27q7). Known: root `index.html` redirects to the missing
  `fr/index.html` until step 3. In WSL, run `source ~/.nvm/nvm.sh` before npm (otherwise the Windows npm is used).
- [x] Delete Jekyll leftovers: `index.md`, `01_about.md`, `01_01_description.md`, `02_getting_started.md`,
      `03_jump_start.md`, `04_extracting_indicators.md`, `image1.png`, `image2.png`, `_config.yml`,
      `README_ignore.md`, `CNAME`.
- [x] Delete current content: `docs/src/en/*.md`, `docs/src/fr/*.md`, all images in `docs/src/assets/`
      except `logo.svg` (check the templates for other referenced assets first). Keep the folders
      (`.gitkeep`) so the build still runs; build must succeed with zero pages or be adjusted.
- [x] Rewrite `.github/workflows/deploy-docs-to-gh-pages.yml`:
      - `push` to `main` → build + deploy
      - `pull_request` → build only (no deploy job)
      - `workflow_dispatch` → manual run
- [x] Rewrite `CONTRIBUTING.md` for the current workflow (doc → `/sync-docs` → PR → main).
- [x] Add this `PLAN.md`.
- [x] User, on GitHub **before merging**: Settings → Environments → `github-pages` → deployment
      branches: allow `main` (it currently allows `v2`). Check Settings → Pages: source = GitHub Actions,
      custom domain = `docs.snt-toolbox.org`.
- [x] User: open PR into `main`, merge, check the Actions run and the live site
      (expected: site up but nearly empty until step 5).
- [x] User, after merge: change nothing else in Pages; delete remote branches `v2` and `just-the-docs`.

> Note: between merging step 1 and step 5 the live site is empty. Accepted (site not in use yet).

### Step 2 — Agent setup and licence (`chore/agent-setup`)

- Agent edits below done 2026-11-10 (build passes). Workflow now reads the Node version from `.nvmrc`
  (`node-version-file`). `LICENSE-docs` holds the official CC BY 4.0 legal code; logos are excluded.
  ADR index and template in `docs/adr/README.md` and `0000-template.md`.

- [x] `CLAUDE.md`: what the repo is, D1/D8 rules, build/preview commands, folder map, pointer to
      `PLAN.md`, `BACKLOG.md`, `docs/adr/`.
- [x] `.claude/settings.json` (committed, shared):
      - deny: `git commit`, `git push`, `git merge`, `git rebase`, `git reset`, `git checkout`,
        `git switch`, `git restore`, `git clean`, `git stash`, `git branch -d/-D`, `git tag`,
        `gh pr create/merge/close`, `gh repo`, `gh api` (non-GET), `rm -rf`; Edit/Write on `docs/build/**`.
      - allow: `git status`, `git diff`, `git log`, `git show`, `git branch` (list), `git fetch`,
        `npm ci`, `npm install`, `npm run docs:build`.
      - Note in CLAUDE.md that deny patterns are a safety net, not a sandbox.
- [x] `docs/adr/` with a short template and ADRs 0001–0005 covering D1+D2, D3, D4, D5 (status: open on
      French ownership), D7.
- [x] `BACKLOG.md`: French version + translation owner; UI redesign with Bluesquare design system;
      search; per-page "last synced" date; link checker in CI.
- [x] `.nvmrc` pinning Node 22 (LTS), and set the workflow's `node-version` to match. The user's
      machine had Node 18 (too old: `package.json` requires >=20); guide them through installing via `nvm`.
- [x] `LICENSE` (MIT, Bluesquare) and `LICENSE-docs` (CC BY 4.0, Bluesquare); a "Licence" section in
      `docs/README.md` stating which applies to what.
- [x] User: open PR into `main`, merge. Check that the new `.claude/settings.json` deny rules apply
      in the next Claude Code session (e.g. `/permissions`). Done 2026-11-10 ("Deny (34)").

### Step 3 — Generator changes (`feat/build-ordering`)

- Agent edits below done 2026-11-10 (build passes with zero pages; dummy pages checked, not committed).
  Merged into `main` 2026-11-10. `docs:serve` uses port 8000 (`PORT` overrides). With zero pages the root
  `index.html` shows "No pages yet". Two pages mapping to the same URL fail the build.

In `docs/scripts/build-docs.mjs`:

- [x] Sort pages by filename (numeric prefix), not by title; strip `NN-` from output paths.
- [x] Home = first page; remove `PREFERRED_HOME_SOURCE_REL = "creer-un-plan.md"`.
- [x] Detect languages from existing folders that contain pages (replace hard-coded `LANGS`);
      hide the language switcher when only one language exists; root `index.html` redirects to `en`.
- [x] Ignore files/folders starting with `_` or `.`; keep ignoring `private/`.
- [x] Add an npm script `docs:serve` that builds and serves `docs/build/` on http://localhost:8000
      (tiny Node static server in `docs/scripts/serve-docs.mjs`, no new dependency; `PORT` overrides);
      `npm ci` → `npm run docs:serve` documented in `docs/README.md` and CLAUDE.md.
- [x] Update `docs/README.md` conventions accordingly.
- [x] Verify with a couple of dummy pages (not committed), then build with the empty tree.

### Step 4 — Sync skill (`feat/sync-skill`)

- Agent edits below done 2026-11-10 (scratch run on Home + tab 2 in a copy of the repo; real tree untouched;
  build passes with zero pages). Design: the agent exports each tab as Markdown (base64, copied verbatim to a
  file; size checked), reads the tab XML for images (`<media>` → blob → asset id → Artifact asset download) and
  tab chips, writes a manifest; `.claude/skills/sync-docs/sync.mjs` writes the files deterministically.
  Images go to `docs/src/assets/<lang>/`, a folder the sync owns. Found: the export drops widgets (Home's
  "Main workflow" diagram → HTML comment + flag), turns tab chips into plain text, keeps the doc's H1/byline
  (replaced by `# <tab name>` / dropped). Not yet seen in the doc: code blocks, task lists, suggestions.

- [x] `.claude/skills/sync-docs/SKILL.md`, invoked as `/sync-docs`. It must:
      1. Read the doc (artifact link above, stored in the skill) via the Claude Docs connector: list tabs,
         order by tab order, read each tab as Markdown.
      2. Write `docs/src/en/NN-<slug>.md` per tab (`00` = Home), starting with
         `<!-- Generated from the Claude Doc "SNT Toolbox documentation", tab "<name>". Do not edit here. -->`
         then `# <tab name>` then the body.
      3. Download embedded images into `docs/src/assets/` with stable names; rewrite links to `../assets/...`.
      4. Convert links between tabs into links between generated pages.
      5. Delete generated pages whose tab no longer exists.
      6. Flag anything that did not convert cleanly (charts, tables, embeds, comments/suggestions
         are excluded) in its final report.
      7. Run `npm run docs:build`, report the result and a summary of changed files; never commit.
      8. Be language-ready: take an optional language + doc link (future French doc → `docs/src/fr/`).
- [x] Test it in a scratch run; check what the connector's Markdown looks like for each block type.
- [x] User: open PR into `main`, merge. Done 2026-11-10 by committing directly to `main` (`1fddfb5`), no PR.

### Step 5 — First content sync (`content/initial-sync`)

- Sync run 2026-11-10 (doc revs 21–129): 9 pages, 17 images (13 MB of PNG screenshots), build passes with 9 pages.
  Found: bold split across adjacent runs exports as `**a ****b**` and showed stray `**` (3 places; now joined by
  `sync.mjs`); 11 images have
  a file name as alt text; Home's "Main workflow" diagram is not synced; some cross-references are plain text,
  not tab chips ("see Setting up the budget" in tabs 1, 4 and 6), so they are not links.

- [ ] Run `/sync-docs`, review the diff and the local build (`docs/build/index.html`) with the user.
- [ ] User: PR, merge, verify the live site shows the 9 pages with Home as landing page.
- [ ] Mark this plan done; move leftovers to `BACKLOG.md`.
