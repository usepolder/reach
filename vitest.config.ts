import * as path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Tests always run against core's source, so `npm test` works on a fresh
    // clone even though the published package entry points at the built lib/.
    alias: {
      '@usepolder/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
    },
  },
  test: {
    include: ['packages/*/tests/**/*.test.ts'],
    // picocolors turns colors ON when CI is set (GitHub Actions), which would
    // make render output differ between local runs and CI. Pin it off.
    env: { NO_COLOR: '1' },
  },
});
