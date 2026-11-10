# Backlog

Ideas and follow-ups that are not scheduled yet. When one is picked up, move it into `PLAN.md`
as a step (and remove it from here).

- **French version.** Publish the documentation in French (`docs/src/fr/`). First decide who owns
  the translation and where it lives: in the Claude Doc (a French doc or tabs) or elsewhere.
  See ADR 0004. `/sync-docs` is meant to accept a language and doc link for this.
- **UI redesign.** Rebuild the site look with Bluesquare's product design system (from Claude
  Design templates); choose the framework at that point. See ADR 0005.
- **Search.** Client-side search across pages.
- **"Last synced" date per page.** Show when each page was last synced from the Claude Doc.
- **Content fixes in the Claude Doc** (for the doc's authors, then re-sync). Found in the first sync:
  11 images have a file name as alt text ("Screenshot 2026-11-09 at …png"); "see Setting up the budget"
  in tabs "What the toolbox does", 4 and 6 is plain text, not a tab link, so it is not a link on the site.
- **Diagrams on the site.** The export drops widgets, so Home's "Main workflow" diagram is missing.
  Options: an image of it in the doc, or teaching `/sync-docs` to render widgets.
- **Images out of the repo.** The 17 synced screenshots are 13 MB of PNG, and git keeps every version
  forever, so compressing or resizing only postpones the problem. Recommended: external storage (S3,
  Cloudflare R2 or GCS, public URL or CDN); `/sync-docs` uploads each image under a content-hash name
  (re-syncs never re-upload) and writes the URL into the Markdown. Open question: PR preview builds would
  show live images, not the PR's. Rejected: Git LFS (small paid GitHub quotas, setup per contributor).
  To check: whether the Claude Doc's own image URLs are public and stable. Meanwhile, a CI check could
  fail on images over a size limit. Images already in git history stay unless history is rewritten
  (a separate, deliberate decision).
- **Restrict merges to `main` to Bluesquare.** A push to `main` deploys the site. Add a ruleset on
  `main`: PR required, at least 1 approval, build check passing, no force-push or deletion, admin-only
  bypass. Who can merge comes from repo permissions: a Bluesquare org team (e.g. `blsq-docs-maintainers`,
  3+ people so leave is covered) gets write; outside contributors get read/triage. Optional on top:
  CODEOWNERS pointing at the team (`* @BLSQ/blsq-docs-maintainers`) with "require code owner review".
- **Content checks in CI.** Content arrives via `/sync-docs` PRs, so check the PR diff (human review
  from the item above stays the main safeguard). Options: a wordlist check (`alex`, `woke` or a small
  script; needs lists per language), Vale (custom rules, also usable for style: product names, banned
  phrases), or an LLM review of the diff (catches tone, costs money, varies between runs, so warn only).
  Suggested: start with Vale or a wordlist as a warning, make it blocking once false positives are tuned.
- **`/sync-docs` cases not seen yet.** Code blocks, task lists, pending suggestions and sub-tabs have not
  appeared in the doc; check the output the first time they do.
- **Link checker in CI.** Fail the PR build on broken internal (and possibly external) links.
