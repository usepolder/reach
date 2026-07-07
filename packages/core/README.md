# @usepolder/core

The shared repo-scanner engine behind [Polder Reach](https://github.com/usepolder/reach) (and, over time, other Polder tools).

What it does:

- **walk:** fast-glob file discovery with include/exclude globs and hard ignores (node_modules, dist, build outputs).
- **imports:** per-file import maps (named, renamed, default, namespace bindings).
- **instances:** classifies every JSX opening element per the Reach denominator ruling (DS instance, other component, styled host, unstyled host; fragments excluded).
- **leaks:** regex-based hex color and hardcoded px detection with file/line locations.
- **report:** the versioned JSON report (`schemaVersion: 1`). Treat its shape as an API: breaking changes bump the version.

Most users want the CLI instead: [`@usepolder/reach`](https://www.npmjs.com/package/@usepolder/reach).

```ts
import { parseConfig, scanRepo } from '@usepolder/core';

const config = parseConfig('component_library: "@acme/ds"');
const report = scanRepo('/path/to/repo', config);
console.log(report.score, report.leaks.total);
```

## License

Apache-2.0 · [Polder](https://github.com/usepolder)
