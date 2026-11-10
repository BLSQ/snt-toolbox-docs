# 0001. The Claude Doc is the source of truth, synced by a Claude Code skill

- Status: accepted
- Date: 2026-11-10

## Context

The team writes the documentation in a Claude Doc, "SNT Toolbox documentation"
(https://claude.ai/artifact/DqgzieyF4gabME36ftNbsw), one tab per page. The site is built from
Markdown files in `docs/src/`. Keeping both edited by hand would let them drift apart.
The Claude Doc can only be read through the Claude Docs connector, which needs a signed-in user;
GitHub Actions cannot authenticate to it.

## Decision

- The Claude Doc is the **single source of truth** for content. Files in `docs/src/<lang>/` are
  generated from it and never edited by hand.
- The conversion is done by a Claude Code project skill, `/sync-docs`, run by a person. That person
  reviews the output, then commits it and opens a PR. There is no scheduled or CI sync.

## Consequences

- Content changes happen in the doc; a manual edit in `docs/src/` is lost at the next sync.
- Publishing needs a person with Claude Code and access to the doc.
- Every content change still goes through a reviewed PR, so the diff shows what changed.
- Anything the skill cannot convert cleanly (charts, embeds, some tables) must be flagged in its
  report and handled by hand in the doc.
