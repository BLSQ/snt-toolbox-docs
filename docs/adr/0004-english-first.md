# 0004. English only for now; French later

- Status: open (who owns the French translation is not decided)
- Date: 2026-11-10

## Context

The Claude Doc is written in English. A French version of the site is required, but it is not yet
decided who translates it, or where the translation lives (in the Claude Doc, in a separate French
doc, or elsewhere).

## Decision

- The site is published in English only for now (`docs/src/en/`).
- The generator detects languages from the folders that contain pages, and shows the language
  switcher only when there is more than one.
- `/sync-docs` takes an optional language and doc link, so a French doc can later be synced into
  `docs/src/fr/` the same way.

## Open question

Who owns the French translation, and where is it written? When this is settled, record it here
(or in a new ADR) and set the status to accepted.

## Consequences

- No French pages until the question is answered; the empty `docs/src/fr/` folder stays in place.
- The work is tracked in `BACKLOG.md`.
