# Polder Reach

One number for design system adoption. Reach scans a React repo and answers: **of all the UI you rendered, how much came from your design system?**

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

No config file needed beyond knowing your design system's package name. Add `--json` for the full machine-readable report.

## The metric

Reach score = **DS instances / (DS instances + other component instances + styled host elements)**

Counted per JSX opening element, full-repo:

- **DS instance:** a capitalized JSX element that resolves (via the file's import map) to a package listed in `component_library`, including subpath imports (`@acme/ds/Button` counts for `@acme/ds`) and member expressions (`<Table.Row>` resolves `Table`).
- **Other component instance:** a capitalized element resolving anywhere else: local components, other libraries.
- **Styled host element:** a lowercase element (`div`, `span`, `button`) carrying a `className` or `style` attribute. A div with className soup is UI that bypassed the system, so it counts against you.
- **Excluded:** fragments and unstyled host elements (layout glue).

The formula is **not configurable**. A score you can tune is a score nobody trusts. `reach.fail_under` gates CI; it never changes the number.

**Leaks** are hardcoded style values found alongside the score: hex colors (`#rgb` through `#rrggbbaa`) in ts/tsx/css/scss, and nonzero `px` values in inline styles, style objects, styled-components templates, and stylesheets.

## Configuration

Reach reads the same `.polder.yml` that [Polder Drift](https://github.com/usepolder/drift) uses:

```yaml
component_library: "@acme/design-system"
reach:
  include: ["src/**"]                          # default: whole repo
  exclude: ["**/*.test.*", "**/*.stories.*"]   # default shown; add your token files
  fail_under: 0                                # optional CI gate, off by default
```

## CLI

```sh
polder-reach [dir] [--library <pkg>] [--json]
```

- `dir` defaults to the current directory.
- `--library` overrides (or replaces) the config's `component_library`.
- `--json` prints the versioned JSON report (`schemaVersion`, score, counts, leaks with file/line, per-file breakdown).
- Exits 1 when `reach.fail_under` is set and the score is below it; 2 on usage errors.

## GitHub Action and badge

The [Reach GitHub Action](https://github.com/usepolder/reach) posts the score (with delta vs the base branch) as a PR comment and keeps a zero-infra README badge up to date. See the repo README for setup.

## License

Apache-2.0 · [Polder](https://github.com/usepolder)
