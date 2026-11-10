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
- **Link checker in CI.** Fail the PR build on broken internal (and possibly external) links.
