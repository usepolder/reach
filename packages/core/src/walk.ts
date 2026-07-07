import fg from 'fast-glob';

// Always skipped regardless of config — vendored, generated, or built output is
// never part of the repo's own UI surface.
const HARD_IGNORES = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.git/**',
  '**/storybook-static/**',
];

export const SOURCE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'] as const;
export const STYLE_EXTENSIONS = ['css', 'scss'] as const;

/**
 * Discover files under `cwd` matching the config's include/exclude globs,
 * filtered to `extensions`. Returns repo-relative posix paths, sorted for
 * deterministic reports.
 */
export function walk(
  cwd: string,
  include: string[],
  exclude: string[],
  extensions: readonly string[],
): string[] {
  const files = fg.sync(include, {
    cwd,
    ignore: [...HARD_IGNORES, ...exclude],
    dot: false,
    onlyFiles: true,
    followSymbolicLinks: false,
  });
  const suffixes = extensions.map((ext) => `.${ext}`);
  return files.filter((f) => suffixes.some((s) => f.endsWith(s))).sort();
}
