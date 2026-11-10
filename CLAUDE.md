# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## What this repo is

The source of the SNT Toolbox documentation site, https://docs.snt-toolbox.org.
A small homemade generator (`docs/scripts/build-docs.mjs`) turns Markdown in `docs/src/<lang>/`
into static HTML in `docs/build/`. GitHub Actions builds it on every PR and deploys it to
GitHub Pages on every push to `main`.

## Rules

- **The Claude Doc is the single source of truth for content** (ADR 0001).
  The content lives in the Claude Doc "SNT Toolbox documentation":
  https://claude.ai/artifact/DqgzieyF4gabME36ftNbsw (read it through the Claude Docs connector,
  never by web fetch). Files in `docs/src/<lang>/` are generated from it by `/sync-docs` and are
  **never edited by hand**. To change content, change the doc and re-sync.
- **Agents do not run git or GitHub write operations.** Read-only git (`status`, `diff`, `log`,
  `show`, `branch`, `fetch`) is fine. Committing, pushing, merging, branching, PRs and destructive
  commands are done by the user. At the end of a task, hand over the exact commands: the
  `git add` file list, the commit message, and the PR title and description.
- Never stage or edit anything under `ignore/`.
- Never edit `docs/build/`: it is generated output.
- Before claiming a change works, run `npm run docs:build` and check its output.

`.claude/settings.json` denies the git/GitHub write commands, `rm -rf` and edits to `docs/build/`.
These deny patterns are a **safety net, not a sandbox**: they match command text and can be
bypassed by a differently worded command. The rule above is what counts; do not look for ways
around the patterns.

## Commands

Run from the repo root. Node 22 is pinned in `.nvmrc` (`package.json` requires >= 20).
In WSL, run `source ~/.nvm/nvm.sh` first (otherwise the Windows `npm` is picked up), then `nvm use`.

```bash
npm ci               # install the exact dependencies from package-lock.json
npm run docs:build   # generate the site into docs/build/
npm run docs:serve   # build, then serve docs/build/ at http://localhost:8000/ (Ctrl+C stops)
```

Local preview routine: `npm ci`, then `npm run docs:serve`, then open http://localhost:8000/.

## Folder map

| Path | What it is |
|------|------------|
| `docs/src/<lang>/` | Generated Markdown pages, one per doc tab (do not edit) |
| `docs/src/assets/` | `logo.svg`; synced images in `docs/src/assets/<lang>/` (do not edit) |
| `docs/src/private/` | Internal notes, ignored by the build |
| `docs/templates/` | HTML template and CSS of the site |
| `docs/scripts/build-docs.mjs` | The site generator |
| `docs/build/` | Build output (git-ignored, do not edit) |
| `docs/adr/` | Architecture decision records |
| `.github/workflows/` | Build (PRs) and deploy (`main`) pipeline |
| `.claude/` | Shared Claude Code settings and project skills (`skills/sync-docs/`: `/sync-docs`) |

## Where to look next

- `PLAN.md`: the current work plan and hand-off point between sessions. Read it fully, then
  resume at the first unchecked step. One step = one PR; stop after handing over the git commands.
- `BACKLOG.md`: ideas and follow-ups not scheduled yet.
- `docs/adr/`: why things are the way they are. Add an ADR when a decision changes.
- `CONTRIBUTING.md`: the publishing workflow for humans.
