# 0003. Page order comes from a numeric filename prefix

- Status: accepted
- Date: 2026-11-10

## Context

The generator sorted pages by title and picked the home page by a hard-coded file name
(`creer-un-plan.md`). The site should instead follow the order of the tabs in the Claude Doc,
where the first tab is the home page.

## Decision

- Each generated page has a two-digit prefix matching its tab position: `00-home.md`, `01-…`, and so on.
- Pages are sorted by file name; the prefix is stripped from the output paths and URLs.
- The first page (`00-…`) is the home page.

## Consequences

- Reordering tabs in the doc reorders the site at the next sync, and renames files (visible in the PR diff).
- URLs do not change when a page moves, as long as its tab name does not change.
- The generator change is done in `PLAN.md` step 3.
