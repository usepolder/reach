# Polder Reach

One number for design system adoption. Reach scans a React repo and answers: **of all the UI you rendered, how much came from your design system?**

```
Polder Reach
Score: 68.4%   (412 DS / 602 countable instances)
  DS components        412
  Other components     134
  Styled host elements  56
```

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
      - uses: usepolder/reach@main
```

The base-branch comparison scans the PR base commit in a temporary git worktree. If the base can't be fetched (fork PRs with restricted tokens, unusual checkouts), the comment ships score-only.

## Repo layout

npm workspaces:

- `packages/core` holds `@usepolder/core`, the scanner engine (walk, import maps, instance classification, versioned JSON report).
- `packages/reach-cli` holds `@usepolder/reach`, the CLI.
- `packages/reach-action` holds the GitHub Action (bundled with ncc; `action.yml` lives at the repo root). Rebuild with `npm run build:action` and commit `packages/reach-action/dist`.

```sh
npm install
npm test
npm run reach -- <path-to-repo> [--library <pkg>] [--json]
```

## Status

v1 in progress. Done: M0 (scaffolding), M1 (engine + CLI), M2 (leaks: hex colors and hardcoded px, with file/line locations), M3 (GitHub Action: upserted PR comment, base-branch delta via git worktree, step summary). Next: M4 badge, M5 npm + Marketplace ship.
