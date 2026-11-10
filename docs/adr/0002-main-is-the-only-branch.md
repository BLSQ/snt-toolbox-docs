# 0002. `main` is the only long-lived and publishing branch

- Status: accepted
- Date: 2026-11-10

## Context

The site used to deploy from a `v2` branch while the default branch was `main`, and a
`just-the-docs` branch from the earlier Jekyll version was still around. It was unclear which
branch was live.

## Decision

- `main` is the only long-lived branch and the one that publishes. `v2` and `just-the-docs` are retired.
- Every push to `main` builds and deploys the site to GitHub Pages; a deploy can also be started by hand.
- Pull requests run the build as a check, without deploying.
- The custom domain is set in GitHub Settings → Pages, not by a `CNAME` file (unused by an Actions deploy).

## Consequences

- Merging a PR into `main` publishes it. Review happens in the PR.
- The `github-pages` environment must allow deployments from `main` only.
