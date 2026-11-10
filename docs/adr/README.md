# Architecture decision records

Short records of the decisions that shape this repository, and why they were made.

To add one: copy `0000-template.md` to the next number (`NNNN-short-title.md`), fill it in, and
add it to the list below. Do not rewrite an accepted ADR when a decision changes: write a new one
and mark the old one "superseded by NNNN".

| # | Decision | Status |
|---|----------|--------|
| [0001](0001-claude-doc-is-source-of-truth.md) | The Claude Doc is the source of truth; synced by a `/sync-docs` skill | accepted |
| [0002](0002-main-is-the-only-branch.md) | `main` is the only long-lived and publishing branch | accepted |
| [0003](0003-page-order-from-filename-prefix.md) | Page order comes from a numeric filename prefix | accepted |
| [0004](0004-english-first.md) | English only for now; French later | open |
| [0005](0005-minimal-ui-until-redesign.md) | Minimal UI changes until a redesign with the Bluesquare design system | accepted |
