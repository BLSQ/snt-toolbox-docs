# 0006. Images are hosted in an OpenHEXA public folder, not in git

- Status: accepted
- Date: 2026-11-19

## Context

`/sync-docs` copies the Claude Doc's images into `docs/src/assets/<lang>/`. The first sync added
17 screenshots, 13 MB of PNG. Git keeps every version of every image forever, so each re-sync that
changes a screenshot makes the repo bigger for good. Compressing or resizing only slows this down.

Options considered: a cloud bucket (S3, Cloudflare R2, GCS) with a public URL, Git LFS (small paid
GitHub quotas, setup per contributor), and an OpenHEXA workspace public folder.

OpenHEXA workspaces can have a `public/` folder whose files anyone can download through a link. We
created the workspace `snt-toolbox-docs` on app.openhexa.org for this. A test on 2026-11-19 (upload one
screenshot, fetch it anonymously, show it in an `<img>` on another origin) showed:

- Upload: GraphQL `prepareObjectUpload` returns a signed Google Cloud Storage URL; a `PUT` with the
  bytes stores the file. Binary files work. A workspace API key (the one the `openhexa` CLI stores in
  `~/.openhexa.ini`) with `managePublicFiles` permission is enough.
- Download: `https://api.openhexa.org/files/snt-toolbox-docs/public/<path>` needs no login. It answers
  with a 302 redirect to a signed storage URL valid for 10 minutes (the redirect is cached for 5).
  The file comes back as `image/png` with `Access-Control-Allow-Origin: *` and no
  `Cross-Origin-Resource-Policy`, and it renders in an `<img>` on another site.
- The base URL is given by the API (`workspace.publicFiles.url`); the feature is not described in the
  OpenHEXA user docs.

## Decision

- Synced images are stored in the `public/` folder of the OpenHEXA workspace `snt-toolbox-docs`
  (app.openhexa.org), not in the repo.
- Each image is named by its content: `public/images/<first 16 hex of its SHA-256>.<ext>`. The name
  does not depend on the language or page, so the same picture in two languages is stored once.
- `/sync-docs` uploads an image only if that name is not there yet, never overwrites a file, and writes
  the absolute URL (`https://api.openhexa.org/files/snt-toolbox-docs/public/images/<name>`) into the
  Markdown. It never deletes uploaded files.
- The person who runs `/sync-docs` needs editor access to the workspace and its API key in the
  `openhexa` CLI config.

## Consequences

- The repo stops growing with each screenshot change. The 13 MB already in git history stays unless
  history is rewritten (a separate, deliberate decision).
- Files never change after upload, so any commit, past or future, shows the images it was synced with.
  A sync on a branch uploads its new images before merge, so a preview of that branch shows them too.
  Images from abandoned branches stay as unused files; cleaning them up is a manual, optional task.
- The site depends on OpenHEXA: if the workspace is deleted, its public folder disabled, or the URL
  scheme changes, the site loses its images. The workspace must be kept and owned by Bluesquare, with
  more than one admin. Because names are content hashes, moving to another host later only means
  copying the files and changing the URL prefix.
- Browsers do not cache the images between visits (the storage response is `private, max-age=0`), so
  each view goes through the redirect and downloads the image again. Acceptable for a few dozen
  screenshots; a CDN would be faster if this becomes a problem.
- Opening an image URL directly downloads the file instead of showing it (`Content-Disposition:
  attachment`). Pages are not affected.
- A local build shows images only with a network connection.
