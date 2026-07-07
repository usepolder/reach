// component_library cases lifted from usepolder/drift tests/config.test.ts;
// reach-block cases are new.
import { describe, it, expect } from 'vitest';
import { parseConfig, readConfig, DEFAULT_EXCLUDE, DEFAULT_INCLUDE } from '../src/config';

describe('parseConfig — component_library (lifted from drift)', () => {
  it('absent config → readConfig returns null', () => {
    expect(readConfig(null)).toBeNull();
  });

  it('component_library as string → single-element array', () => {
    const cfg = parseConfig('component_library: "@acme/ds"');
    expect(cfg.componentLibrary).toEqual(['@acme/ds']);
  });

  it('component_library as array of strings → all entries preserved', () => {
    const cfg = parseConfig('component_library:\n  - "@acme/ds"\n  - "@acme/icons"');
    expect(cfg.componentLibrary).toEqual(['@acme/ds', '@acme/icons']);
  });

  it('component_library as empty array → throws', () => {
    expect(() => parseConfig('component_library: []')).toThrow('component_library is required');
  });

  it('component_library missing → throws', () => {
    expect(() => parseConfig('reach: {}')).toThrow('component_library is required');
  });

  it('component_library with non-string entry → throws', () => {
    expect(() => parseConfig('component_library:\n  - "@acme/ds"\n  - 42')).toThrow(
      'component_library entries must all be strings',
    );
  });

  it('invalid YAML → throws with human-readable error', () => {
    expect(() => parseConfig(': : invalid')).toThrow('Invalid YAML');
  });
});

describe('parseConfig — reach block', () => {
  it('absent reach block → defaults', () => {
    const cfg = parseConfig('component_library: "@acme/ds"');
    expect(cfg.reach.include).toEqual(DEFAULT_INCLUDE);
    expect(cfg.reach.exclude).toEqual(DEFAULT_EXCLUDE);
    expect(cfg.reach.failUnder).toBe(0);
  });

  it('include/exclude/fail_under parsed', () => {
    const cfg = parseConfig(
      [
        'component_library: "@acme/ds"',
        'reach:',
        '  include: ["src/**"]',
        '  exclude: ["**/*.test.*"]',
        '  fail_under: 60',
      ].join('\n'),
    );
    expect(cfg.reach.include).toEqual(['src/**']);
    expect(cfg.reach.exclude).toEqual(['**/*.test.*']);
    expect(cfg.reach.failUnder).toBe(60);
  });

  it('include with non-string entry → throws', () => {
    expect(() =>
      parseConfig('component_library: "@acme/ds"\nreach:\n  include: [42]'),
    ).toThrow('reach.include must be an array of non-empty strings');
  });

  it('fail_under out of range → throws', () => {
    expect(() =>
      parseConfig('component_library: "@acme/ds"\nreach:\n  fail_under: 150'),
    ).toThrow('reach.fail_under must be a number between 0 and 100');
  });

  it('drift-only keys are ignored, not rejected (one .polder.yml for both tools)', () => {
    const cfg = parseConfig(
      [
        'component_library: "@acme/ds"',
        'allowlist:',
        '  - "src/wrappers/"',
        'fail_on_drift: true',
        'tokens:',
        '  "#0f62fe": blue-60',
        'library_paths:',
        '  "@acme/ds": ../design-system',
      ].join('\n'),
    );
    expect(cfg.componentLibrary).toEqual(['@acme/ds']);
    expect(cfg.reach.failUnder).toBe(0);
  });
});
