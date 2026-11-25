# Polder Reach

![Reach](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/usepolder/reach/main/.polder/reach-badge.json)

One number for design system adoption. Reach scans a React repo and answers: **of all the UI you rendered, how much came from your design system?**

## Try it now

```sh
npx @usepolder/reach --library "@your/design-system"
```

```
Polder Reach
Score: 68.4%   (412 DS / 602 countable instances)
  DS components        412
  Other components     134
  Styled host elements  56
Leaks: 87   (61 hex colors, 26 px values)
  Top offenders: src/styles/legacy.css (34), src/components/Hero.tsx (12)
```

Zero config beyond your design system's package name. Add `--json` for the full machine-readable report, including `usage`: DS instances per component (`Table.Row` counts toward `Table`; `Button as Btn` counts as `Button`), which [Current](https://github.com/usepolder/current) uses to rank what to fix first. See it running on a real repo: [usepolder/reach-demo](https://github.com/usepolder/reach-demo).

## The metric

Reach score = **DS instances / (DS instances + other component instances + styled host elements)**

Counted per JSX opening element, full-repo:

- **DS instance:** a capitalized JSX element that resolves (via the file's import map) to a package listed in `component_library`, including subpath imports (`@acme/ds/Button` counts for `@acme/ds`) and member expressions (`<Table.Row>` resolves `Table`).
- **Other component instance:** a capitalized element resolving anywhere else: local components, other libraries.
- **Styled host element:** a lowercase element (`div`, `span`, `button`) carrying a `className` or `style` attribute. A div with className soup is UI that bypassed the system, so it counts against you.
- **Excluded:** fragments and unstyled host elements (layout glue).

The formula is **not configurable**. A score you can tune is a score nobody trusts. `reach.fail_under` gates CI; it never changes the number.

## Configuration

Reach reads the same `.polder.yml` that [Polder Drift](https://github.com/usepolder/drift) uses:

```yaml
component_library: "@acme/design-system"
reach:
  include: ["src/**"]                          # default: whole repo
  exclude: ["**/*.test.*", "**/*.stories.*"]   # default shown
  fail_under: 0                                # optional CI gate, off by default
```

Zero-config run: `reach --library "@acme/design-system"`.

## GitHub Action

Posts one PR comment (updated in place on every push) with the score, the delta vs the base branch, and the leak count. Also writes the workflow step summary and sets `score`, `base-score`, and `leaks` outputs.

```yaml
name: Reach
on: [pull_request]
permissions:
  contents: read
  pull-requests: write
jobs:
  reach:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: usepolder/reach@v1
```

The base-branch comparison scans the PR base commit in a temporary git worktree. If the base can't be fetched (fork PRs with restricted tokens, unusual checkouts), the comment ships score-only.

## Badge (zero infra)

On every push to the default branch the action writes and commits two files, then embeds are just markdown. No hosted service.

- **Public repos** (shields.io endpoint mode):

  ```md
  ![Reach](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/OWNER/REPO/main/.polder/reach-badge.json)
  ```

- **Private repos** (committed static SVG, since shields.io can't fetch private raw files):

  ```md
  ![Reach](.polder/reach-badge.svg)
  ```

The badge commit is `chore: update Reach badge [skip ci]` and is skipped entirely when the score didn't change. The workflow needs `contents: write` permission on push.

## Repo layout

npm workspaces:

- `packages/core` holds [`@usepolder/core`](https://www.npmjs.com/package/@usepolder/core), the scanner engine (walk, import maps, instance classification, leaks, versioned JSON report).
- `packages/reach-cli` holds [`@usepolder/reach`](https://www.npmjs.com/package/@usepolder/reach), the CLI (`polder-reach` bin).
- `packages/reach-action` holds the GitHub Action (bundled with ncc; `action.yml` lives at the repo root). Rebuild with `npm run build:action` and commit `packages/reach-action/dist`.

```sh
npm install
npm test
npm run reach -- <path-to-repo> [--library <pkg>] [--json]
```

Releasing: `npm run build`, then `npm publish -w @usepolder/core -w @usepolder/reach`; tag `vX.Y.Z`, move the `v1` tag, and create a GitHub release for the Marketplace.

## Status

v1.0.0. CLI (`npx @usepolder/reach`), GitHub Action (PR comment with base-branch delta), and zero-infra badge. On the roadmap: Azure DevOps task, monorepo per-package scores.
