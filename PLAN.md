# Plan: images out of the repo (OpenHEXA public folder)

Status: **in progress** (started 2026-11-19). The previous plan (repo cleanup, deployment and first
content sync, done 2026-11-10) is in git history.

This file is the hand-off point between agent sessions. Read it fully before doing anything,
then pick up the first unchecked step.

## Context

- `/sync-docs` copies the Claude Doc's images into `docs/src/assets/<lang>/`: 17 screenshots, 13 MB
  of PNG so far, and git keeps every version forever.
- Decision (ADR 0006): images live in the `public/` folder of the OpenHEXA workspace
  `snt-toolbox-docs` (app.openhexa.org), named `public/images/<sha256 prefix 16>.<ext>`, and pages link
  to `https://api.openhexa.org/files/snt-toolbox-docs/public/images/<name>`. ADR 0006 has the test
  results (redirect to a signed URL, headers, caching) and the risks.
- Upload, as tested: GraphQL at `https://api.openhexa.org/graphql/` with header
  `Authorization: Bearer <workspace API key>` (from `~/.openhexa.ini`, section `[workspaces]`, key
  `snt-toolbox-docs`); mutation `prepareObjectUpload(input: {workspaceSlug, objectKey, contentType})`
  returns `uploadUrl`; then `PUT` the bytes with the same `Content-Type`. Existence check:
  `workspace(slug) { bucket { object(key) { key } } }`. The OpenHEXA MCP connector is not used: it is not
  authorized for this workspace and its `write_file` takes text only.

## Working rules for agents

- One step = one PR. Finish a step, hand over the git commands, **stop**. Do not edit files for the
  next step until the user confirms the current one is committed.
- Never stage anything under `ignore/`. Never print the API key.
- Uploading to or deleting from the OpenHEXA workspace is an outside write: ask the user first.
- Before claiming a step is done, run `npm run docs:build` and check the output.

## Steps

### Step 1 — Feasibility check

- [x] Done 2026-11-19: one screenshot uploaded to `public/_probe/`, fetched anonymously, rendered in an
      `<img>` on another origin (checked by the user), then deleted. Result: go. Details in ADR 0006.

### Step 2 — ADR 0006 and this plan

- [x] `docs/adr/0006-images-in-openhexa-public-folder.md`, ADR index, this `PLAN.md`, backlog item removed.
- [x] User: committed 2026-11-19. Steps 2 and 3 go in one PR (user's choice).

### Step 3 — `/sync-docs` uploads images

- Done 2026-11-19. Tested on a scratch copy with a one-page manifest: dry run, missing and wrong key
  (clear errors, nothing written), real run (2 images uploaded, 17 local images removed), second run
  (nothing uploaded, page unchanged), `curl` (200 `image/png`, same SHA-256), build (`<img>` points at
  OpenHEXA). The 2 test images, `public/images/bcec401cdd4f2a6e.png` and `813bf3b35f7d4ea6.png`, are real
  synced screenshots and were kept: the migration will find them already there.

- [x] `sync.mjs`: for each image, hash the bytes, check whether `public/images/<name>` exists, upload it
      if not, and write the absolute URL into the Markdown. Stop writing to `docs/src/assets/<lang>/`
      (leftover files there are removed). API key from `OPENHEXA_TOKEN` or `~/.openhexa.ini`; clear error
      if missing. Never overwrites (stops if a name exists with another size) or deletes uploaded files.
- [x] `SKILL.md`: "Before you start" (workspace key), image behaviour, `curl` check, report and git commands.
- [x] Test on a scratch copy of the repo; ask before the real uploads.
- [ ] User: commit, PR (with step 2), merge.

### Step 4 — Migrate the existing images

- [ ] Run `/sync-docs`: pages now point at OpenHEXA URLs; check every image loads (HTTP 200 after the
      redirect) and the local build shows them.
- [ ] Remove `docs/src/assets/<lang>/` images (user runs `git rm`); keep `logo.svg`.
- [ ] Update `CLAUDE.md` (folder map), `CONTRIBUTING.md` (workspace access and CLI key needed to sync),
      `docs/README.md` if it mentions image folders.
- [ ] User: commit, PR, merge; check the live site's images.

### Step 5 (optional) — Guard against images coming back

- [ ] CI check that fails the build when a PR adds an image under `docs/src/` (or over a size limit).
