import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/tests/**/*.test.ts'],
    // picocolors turns colors ON when CI is set (GitHub Actions), which would
    // make render output differ between local runs and CI. Pin it off.
    env: { NO_COLOR: '1' },
  },
});
