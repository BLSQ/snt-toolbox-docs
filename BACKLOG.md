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
- **Smaller images.** The 17 synced screenshots are 13 MB of PNG; compress or resize them in the sync.
- **`/sync-docs` cases not seen yet.** Code blocks, task lists, pending suggestions and sub-tabs have not
  appeared in the doc; check the output the first time they do.
- **Link checker in CI.** Fail the PR build on broken internal (and possibly external) links.
