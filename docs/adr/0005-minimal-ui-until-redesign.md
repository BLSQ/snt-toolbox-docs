# 0005. Minimal UI changes until a redesign with the Bluesquare design system

- Status: accepted
- Date: 2026-11-10

## Context

The site uses a small homemade generator with a plain HTML template and CSS. A proper look and
feel will come from Bluesquare's product design system (from Claude Design templates), which is
not applied yet. Investing in the current UI, or picking a site framework now, would likely be
thrown away.

## Decision

- Only minimal generator and template changes for now (ordering, home page, languages, preview).
- The redesign will use Bluesquare's product design system. The choice of framework (keep the
  homemade generator or move to a static site tool) is deferred until then.

## Consequences

- The site stays simple and functional in the meantime.
- The redesign is tracked in `BACKLOG.md` and will get its own ADR.
